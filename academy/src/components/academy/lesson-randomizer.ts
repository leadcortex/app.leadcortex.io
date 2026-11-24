// academy/src/components/academy/lesson-randomizer.ts

import type { Exercise } from "../../lib/model";

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextRand(state: number): number {
  let x = state | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function shuffleWithSeed<T>(arr: readonly T[], seed: number): T[] {
  const out = [...arr];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = nextRand(state);
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function randomizeExercise(ex: Exercise, seed: number): Exercise {
  switch (ex.kind) {
    case "mcq": {
      const opts = ex.payload.options ?? [];
      if (opts.length < 2) return ex;
      const indices = opts.map((_, i) => i);
      const shuffled = shuffleWithSeed(indices, seed);
      const newOpts = shuffled.map((i) => opts[i]!);
      const oldCorrect = ex.payload.correct as number;
      const newCorrect = shuffled.indexOf(oldCorrect);
      return {
        ...ex,
        payload: { ...ex.payload, options: newOpts, correct: newCorrect },
      };
    }
    case "multi_select": {
      const opts = ex.payload.options ?? [];
      if (opts.length < 2) return ex;
      const indices = opts.map((_, i) => i);
      const shuffled = shuffleWithSeed(indices, seed);
      const newOpts = shuffled.map((i) => opts[i]!);
      const oldCorrect = (ex.payload.correct as number[]) ?? [];
      const newCorrect = oldCorrect.map((c) => shuffled.indexOf(c)).sort((a, b) => a - b);
      return {
        ...ex,
        payload: { ...ex.payload, options: newOpts, correct: newCorrect },
      };
    }
    case "order_steps": {
      const steps = ex.payload.steps ?? [];
      if (steps.length < 2) return ex;
      const indices = steps.map((_, i) => i);
      const shuffled = shuffleWithSeed(indices, seed);
      return {
        ...ex,
        payload: { ...ex.payload, __initialOrder: shuffled },
      };
    }
    default:
      return ex;
  }
}

export function initialOrderFor(ex: Exercise, seed: number): number[] {
  const steps = ex.payload.steps ?? [];
  const indices = steps.map((_, i) => i);
  return shuffleWithSeed(indices, seed);
}

export function shuffleExercises(exercises: Exercise[], seed: number): Exercise[] {
  return shuffleWithSeed(exercises, seed);
}
