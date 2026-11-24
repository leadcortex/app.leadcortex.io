// academy/src/lib/exercise-checker.ts

import type { Answer, Exercise } from "./model";
import { checkAnswer } from "./model";

export function isExerciseReady(exercise: Exercise, answer: Answer): boolean {
  const p = exercise.payload;

  switch (exercise.kind) {
    case "mcq":
      return answer.length > 0;
    case "multi_select":
      return answer.length > 0;
    case "fill_blank":
      return (p.blanks ?? []).every(
        (_, i) => String(answer[i] ?? "").trim().length > 0,
      );
    case "order_steps":
      return (answer as number[]).length === (p.steps ?? []).length;
    case "match_pairs":
      return (p.pairs ?? []).every((_, i) => answer[i] === String(i));
    case "free_text": {
      const words = String(answer[0] ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      return words >= (p.min_words ?? 1);
    }
    case "scenario":
      return (answer as number[]).length === (p.turns?.length ?? p.steps?.length ?? 0);

    case "categorize":
      return (answer as number[]).length === (p.items ?? []).length &&
        (answer as number[]).every((n) => n >= 0);

    case "timeline":
      return (answer as number[]).length === (p.events ?? []).length &&
        new Set(answer as number[]).size === (p.events ?? []).length;

    case "connect_signals":
      return (answer as number[]).length === (p.left_items ?? []).length &&
        (answer as number[]).every((n) => n >= 0);

    case "sort_priority":
      return (answer as number[]).length === (p.sortables ?? []).length;

    case "roleplay":
      return (answer as number[]).length === (p.turns ?? []).length;

    case "hot_cold_click":
      return (answer as number[]).length > 0;

    case "fill_email":
      return (p.blanks ?? []).every(
        (_, i) => String(answer[i] ?? "").trim().length > 0,
      );

    default:
      return false;
  }
}

export function checkExercise(exercise: Exercise, answer: Answer): boolean | null {
  switch (exercise.kind) {
    case "categorize":
      return checkCategorize(exercise, answer as number[]);
    case "timeline":
      return checkTimeline(exercise, answer as number[]);
    case "connect_signals":
      return checkConnectSignals(exercise, answer as number[]);
    case "sort_priority":
      return checkSortPriority(exercise, answer as number[]);
    case "roleplay":
      return checkRoleplay(exercise, answer as number[]);
    case "hot_cold_click":
      return checkHotColdClick(exercise, answer as number[]);
    case "fill_email":
      return checkFillEmail(exercise, answer as string[]);
    default:
      return checkAnswer(exercise, answer);
  }
}

function checkCategorize(exercise: Exercise, answer: number[]): boolean {
  const items = exercise.payload.items ?? [];
  const categories = exercise.payload.categories ?? [];
  return items.every((item, i) => {
    const expectedIdx = categories.indexOf(item.category ?? "");
    return expectedIdx >= 0 && answer[i] === expectedIdx;
  });
}

function checkTimeline(exercise: Exercise, answer: number[]): boolean {
  const events = exercise.payload.events ?? [];
  return events.every((_, i) => answer[i] === i);
}

function checkConnectSignals(exercise: Exercise, answer: number[]): boolean {
  const links = exercise.payload.links ?? [];
  if (links.length === 0) return false;
  return links.every(([leftIdx, rightIdx]) => answer[leftIdx] === rightIdx);
}

function checkSortPriority(exercise: Exercise, answer: number[]): boolean {
  const items = exercise.payload.sortables ?? [];
  return items.every((_, i) => answer[i] === i);
}

function checkRoleplay(exercise: Exercise, answer: number[]): boolean {
  const turns = exercise.payload.turns ?? [];
  return turns.every((turn, t) => {
    const choice = turn.choices[answer[t] ?? -1];
    return !!choice?.correct;
  });
}

function checkHotColdClick(exercise: Exercise, answer: number[]): boolean {
  const items = exercise.payload.items ?? [];
  const expected = items
    .map((it, i) => (it.hot ? i : -1))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const got = [...answer].sort((a, b) => a - b);
  if (expected.length !== got.length) return false;
  return expected.every((v, i) => v === got[i]);
}

function checkFillEmail(exercise: Exercise, answer: string[]): boolean {
  const blanks = exercise.payload.blanks ?? [];
  return blanks.every((b, i) =>
    b.correct.some(
      (s) =>
        s.toLocaleLowerCase().trim() ===
        String(answer[i] ?? "").toLocaleLowerCase().trim(),
    ),
  );
}
