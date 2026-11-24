// academy/src/components/academy/exercises/categorize.tsx

import { useMemo, useState } from "react";
import { Check } from "../../../../../frontend/components/icons";

import type { Exercise, Answer } from "../../../lib/model";

const CATEGORY_COLORS = [
  "var(--academy-green)",
  "var(--academy-gold)",
  "var(--academy-red)",
  "oklch(0.55 0.15 236)",
];

export function CategorizeExercise({
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
  const items = exercise.payload.items ?? [];
  const categories = exercise.payload.categories ?? [];

  const [activeItem, setActiveItem] = useState<number | null>(null);

  const placed = useMemo<number[]>(() => {
    const arr = [...(answer as number[])];
    while (arr.length < items.length) arr.push(-1);
    return arr;
  }, [answer, items.length]);

  const placedSet = useMemo(
    () => new Set(placed.map((c, i) => (c >= 0 ? i : -1)).filter((i) => i >= 0)),
    [placed],
  );

  const assign = (itemIdx: number, catIdx: number) => {
    if (disabled) return;
    const next = [...placed];
    next[itemIdx] = catIdx;
    onAnswer(next);
    setActiveItem(null);
  };

  const unassign = (itemIdx: number) => {
    if (disabled) return;
    const next = [...placed];
    next[itemIdx] = -1;
    onAnswer(next);
    setActiveItem(itemIdx);
  };

  return (
    <div className="categorize">
      <div className="categorize__board">
        {categories.map((cat, ci) => {
          const itemsInCat = placed
            .map((assignedCat, itemIdx) =>
              assignedCat === ci ? itemIdx : -1,
            )
            .filter((i) => i >= 0);
          const color = CATEGORY_COLORS[ci % CATEGORY_COLORS.length]!;
          return (
            <div
              key={cat}
              className={`categorize__column ${activeItem !== null ? "is-target" : ""}`}
              style={{ ["--cat-color" as string]: color }}
              onClick={() => {
                if (activeItem !== null) assign(activeItem, ci);
              }}
            >
              <header className="categorize__column-head">
                <span className="categorize__column-dot" aria-hidden />
                <span className="categorize__column-label">{cat}</span>
                <span className="categorize__column-count">
                  {itemsInCat.length}
                </span>
              </header>
              <div className="categorize__column-body">
                {itemsInCat.length === 0 ? (
                  <p className="categorize__column-empty">
                    {activeItem !== null
                      ? "Clique ici pour placer"
                      : "Aucun item"}
                  </p>
                ) : (
                  itemsInCat.map((itemIdx) => (
                    <button
                      key={itemIdx}
                      type="button"
                      className="categorize__pill categorize__pill--placed"
                      onClick={(e) => {
                        e.stopPropagation();
                        unassign(itemIdx);
                      }}
                      disabled={disabled}
                      title="Cliquer pour retirer"
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                      {items[itemIdx]?.text}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="categorize__pool">
        <p className="categorize__pool-label">
          {placedSet.size < items.length
            ? `Il reste ${items.length - placedSet.size} item${
                items.length - placedSet.size > 1 ? "s" : ""
              } à placer.`
            : "Tous les items sont placés. Vérifie ta réponse."}
        </p>
        <div className="categorize__tokens">
          {items.map((item, i) => {
            if (placedSet.has(i)) return null;
            const isActive = activeItem === i;
            return (
              <button
                key={i}
                type="button"
                className={`categorize__pill ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveItem(isActive ? null : i)}
                disabled={disabled}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
