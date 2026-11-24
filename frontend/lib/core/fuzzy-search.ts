// frontend/lib/core/fuzzy-search.ts

export type FuzzyMatch = {
  score: number;
  indices: number[];
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function cleanQuery(q: string): string {
  return q
    .replace(/[/\\\-_.·]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, indices: [] };
  const q = normalize(query);
  const t = normalize(target);

  const indices: number[] = [];
  let qi = 0;
  let score = 0;
  let consecutive = 0;
  let lastMatch = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue;

    const prev = t[ti - 1];
    const isBoundary =
      ti === 0 ||
      prev === " " ||
      prev === "-" ||
      prev === "_" ||
      prev === "/" ||
      prev === "." ||
      prev === "·";

    if (ti === 0) score += 12;
    if (isBoundary) score += 8;

    if (lastMatch === ti - 1) {
      consecutive++;
      score += 4 + consecutive * 3;
    } else {
      consecutive = 0;
      if (lastMatch >= 0) {
        score -= Math.min(6, ti - lastMatch - 1);
      }
    }

    indices.push(ti);
    lastMatch = ti;
    qi++;
  }

  if (qi < q.length) return null;

  score += Math.max(0, 30 - t.length);
  score += Math.max(0, 15 - (indices[0] ?? 0));

  return { score, indices };
}

export function highlightRanges(
  target: string,
  indices: number[],
): Array<{ text: string; match: boolean }> {
  if (indices.length === 0) return [{ text: target, match: false }];
  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const parts: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const i of sorted) {
    if (i > cursor) parts.push({ text: target.slice(cursor, i), match: false });
    parts.push({ text: target[i] ?? "", match: true });
    cursor = i + 1;
  }
  if (cursor < target.length) {
    parts.push({ text: target.slice(cursor), match: false });
  }
  return parts;
}
