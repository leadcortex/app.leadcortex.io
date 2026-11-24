// academy/src/lib/exercise-pool.ts

import type { Exercise, ExerciseTier } from "./model";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let state = seed || 1;
  return {
    next(): number {
      let x = state | 0;
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      state = x >>> 0;
      return state;
    },
    int(n: number): number {
      if (n <= 0) return 0;
      return this.next() % n;
    },
    shuffle<T>(arr: readonly T[]): T[] {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
  };
}

export type SelectOptions = {
  seed: string;
  count?: number;
  targetTier?: ExerciseTier;
  excludeIds?: string[];
};

function tierOf(ex: Exercise): ExerciseTier {
  return (ex.tier ?? 1) as ExerciseTier;
}

function tierAffinity(ex: Exercise, target: ExerciseTier): number {
  const t = tierOf(ex);
  const distance = Math.abs(t - target);
  return Math.max(10, 100 - distance * 25);
}

function groupByConcept(pool: Exercise[]): Map<string, Exercise[]> {
  const map = new Map<string, Exercise[]>();
  for (const ex of pool) {
    const key = ex.concepts?.[0] ?? ex.variant_of ?? ex.id;
    const bucket = map.get(key) ?? [];
    bucket.push(ex);
    map.set(key, bucket);
  }
  return map;
}

export function selectExercises(
  pool: Exercise[],
  opts: SelectOptions,
): Exercise[] {
  if (pool.length === 0) return [];

  const count = Math.max(1, Math.min(opts.count ?? 6, pool.length));
  const target = opts.targetTier ?? 2;
  const excludeSet = new Set(opts.excludeIds ?? []);

  const rng = makeRng(hashStr(opts.seed));

  const available = pool.filter((ex) => !excludeSet.has(ex.id));
  const source = available.length >= count ? available : pool;

  const groups = groupByConcept(source);

  const picked: Exercise[] = [];
  const pickedIds = new Set<string>();
  const groupKeys = rng.shuffle(Array.from(groups.keys()));

  for (const key of groupKeys) {
    if (picked.length >= count) break;
    const variants = groups.get(key)!;
    const chosen = pickBestVariant(variants, target, rng);
    if (chosen && !pickedIds.has(chosen.id)) {
      picked.push(chosen);
      pickedIds.add(chosen.id);
    }
  }

  if (picked.length < count) {
    const remaining = source
      .filter((ex) => !pickedIds.has(ex.id))
      .map((ex) => ({ ex, score: tierAffinity(ex, target) + rng.int(30) }))
      .sort((a, b) => b.score - a.score);
    for (const { ex } of remaining) {
      if (picked.length >= count) break;
      picked.push(ex);
      pickedIds.add(ex.id);
    }
  }

  const ordered = picked
    .map((ex) => ({ ex, jitter: rng.int(100) }))
    .sort((a, b) => {
      const dt = tierOf(a.ex) - tierOf(b.ex);
      if (dt !== 0) return dt;
      return a.jitter - b.jitter;
    })
    .map((x) => x.ex);

  return ordered;
}

function pickBestVariant(
  variants: Exercise[],
  target: ExerciseTier,
  rng: ReturnType<typeof makeRng>,
): Exercise | null {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0]!;

  const weights = variants.map((ex) => tierAffinity(ex, target));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return variants[rng.int(variants.length)]!;

  const roll = rng.int(total);
  let acc = 0;
  for (let i = 0; i < variants.length; i++) {
    acc += weights[i]!;
    if (roll < acc) return variants[i]!;
  }
  return variants[variants.length - 1]!;
}

export function sessionSeed(
  lessonId: string,
  userId: string,
  date = new Date(),
): string {
  const day = date.toISOString().slice(0, 10);
  return `${lessonId}:${userId}:${day}`;
}
