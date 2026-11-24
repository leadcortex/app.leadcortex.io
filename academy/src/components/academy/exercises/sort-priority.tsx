// academy/src/components/academy/exercises/sort-priority.tsx

import { useMemo, useState } from "react";
import { GripVertical, ArrowUp, ArrowDown } from "../../../../../frontend/components/icons";

import type { Exercise, Answer } from "../../../lib/model";
import { hashStr } from "../lesson-randomizer";

function shuffledIndices(count: number, seed: string): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  let state = hashStr(seed) || 1;
  for (let i = indices.length - 1; i > 0; i--) {
    let x = state | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    state = x >>> 0;
    const j = state % (i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}

export function SortPriorityExercise({
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
  const sortables = exercise.payload.sortables ?? [];

  const initialOrder = useMemo(
    () => shuffledIndices(sortables.length, exercise.id),
    [sortables.length, exercise.id],
  );

  const order = useMemo<number[]>(() => {
    const arr = [...(answer as number[])];
    if (arr.length !== sortables.length) return initialOrder;
    return arr;
  }, [answer, initialOrder, sortables.length]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const commit = (next: number[]) => onAnswer(next);

  const move = (from: number, to: number) => {
    if (disabled) return;
    if (from === to || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    commit(next);
  };

  return (
    <div className="sort-priority">
      <p className="sort-priority__hint">
        Classe du plus prioritaire (haut) au moins prioritaire (bas).
      </p>
      <ul className="sort-priority__list">
        {order.map((originalIdx, pos) => {
          const isDragging = dragIdx === pos;
          const isOver = overIdx === pos && dragIdx !== null && dragIdx !== pos;
          return (
            <li
              key={originalIdx}
              className={`sort-priority__item ${
                isDragging ? "is-dragging" : ""
              } ${isOver ? "is-over" : ""}`}
              draggable={!disabled}
              onDragStart={(e) => {
                if (disabled) return;
                e.dataTransfer.effectAllowed = "move";
                setDragIdx(pos);
              }}
              onDragOver={(e) => {
                if (disabled) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverIdx(pos);
              }}
              onDragLeave={() => setOverIdx(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) move(dragIdx, pos);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
            >
              <span className="sort-priority__rank">{pos + 1}</span>
              <span className="sort-priority__handle" aria-hidden="true">
                <GripVertical className="w-4 h-4" />
              </span>
              <span className="sort-priority__text">
                {sortables[originalIdx]}
              </span>
              <div className="sort-priority__controls">
                <button
                  type="button"
                  aria-label="Monter"
                  onClick={() => move(pos, pos - 1)}
                  disabled={disabled || pos === 0}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Descendre"
                  onClick={() => move(pos, pos + 1)}
                  disabled={disabled || pos === order.length - 1}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
