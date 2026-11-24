// academy/src/components/academy/exercises/connect-signals.tsx

import { useMemo, useState } from "react";

import type { Exercise, Answer } from "../../../lib/model";

const LINK_COLORS = [
  "var(--academy-gold)",
  "var(--academy-green)",
  "var(--academy-red)",
  "oklch(0.55 0.15 236)",
  "oklch(0.62 0.18 305)",
  "oklch(0.7 0.16 40)",
];

export function ConnectSignalsExercise({
  exercise,
  answer,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: Answer) => void;
}) {
  const leftItems = exercise.payload.left_items ?? [];
  const rightItems = exercise.payload.right_items ?? [];

  const [activeLeft, setActiveLeft] = useState<number | null>(null);

  const links = useMemo<number[]>(() => {
    const arr = [...(answer as number[])];
    while (arr.length < leftItems.length) arr.push(-1);
    return arr;
  }, [answer, leftItems.length]);

  const rightUsage = useMemo(() => {
    const map = new Map<number, number>();
    links.forEach((r, l) => {
      if (r >= 0) map.set(r, l);
    });
    return map;
  }, [links]);

  const link = (leftIdx: number, rightIdx: number) => {
    if (disabled) return;
    const next = [...links];
    const previousLeft = rightUsage.get(rightIdx);
    if (previousLeft !== undefined && previousLeft !== leftIdx) {
      next[previousLeft] = -1;
    }
    next[leftIdx] = rightIdx;
    onAnswer(next);
    setActiveLeft(null);
  };

  const unlink = (leftIdx: number) => {
    if (disabled) return;
    const next = [...links];
    next[leftIdx] = -1;
    onAnswer(next);
    setActiveLeft(leftIdx);
  };

  const colorForLeft = (leftIdx: number): string =>
    LINK_COLORS[leftIdx % LINK_COLORS.length]!;

  return (
    <div className="connect-signals">
      <div className="connect-signals__columns">
        <div className="connect-signals__col connect-signals__col--left">
          {leftItems.map((label, i) => {
            const isLinked = links[i]! >= 0;
            const isActive = activeLeft === i;
            return (
              <button
                key={i}
                type="button"
                className={`connect-signals__item ${
                  isLinked ? "is-linked" : ""
                } ${isActive ? "is-active" : ""}`}
                style={{
                  ["--pair-color" as string]: colorForLeft(i),
                }}
                onClick={() =>
                  isLinked ? unlink(i) : setActiveLeft(isActive ? null : i)
                }
                disabled={disabled}
              >
                <span className="connect-signals__dot" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div className="connect-signals__col connect-signals__col--right">
          {rightItems.map((label, j) => {
            const owner = rightUsage.get(j);
            const isUsed = owner !== undefined;
            return (
              <button
                key={j}
                type="button"
                className={`connect-signals__item ${
                  isUsed ? "is-linked" : ""
                } ${activeLeft !== null && !isUsed ? "is-target" : ""}`}
                style={{
                  ["--pair-color" as string]:
                    owner !== undefined
                      ? colorForLeft(owner)
                      : "var(--academy-line)",
                }}
                onClick={() => {
                  if (activeLeft === null) return;
                  if (isUsed && owner !== activeLeft) return;
                  link(activeLeft, j);
                }}
                disabled={disabled || (activeLeft === null && !isUsed)}
              >
                <span className="connect-signals__dot" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="connect-signals__hint">
        {activeLeft !== null
          ? "Choisis maintenant un élément à droite."
          : "Clique sur un élément de gauche, puis sur son associé à droite."}
      </p>
    </div>
  );
}
