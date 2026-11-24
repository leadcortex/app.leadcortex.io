// academy/src/components/academy/exercises/hot-cold-click.tsx

import { useEffect, useMemo, useState } from "react";
import { Flame, Timer } from "../../../../../frontend/components/icons";

import type { Exercise, Answer } from "../../../lib/model";
import { hashStr } from "../lesson-randomizer";

function shuffledIndices(count: number, seed: string): number[] {
  const idx = Array.from({ length: count }, (_, i) => i);
  let state = hashStr(seed) || 1;
  for (let i = idx.length - 1; i > 0; i--) {
    let x = state | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    state = x >>> 0;
    const j = state % (i + 1);
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  return idx;
}

export function HotColdClickExercise({
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
  const durationSec = exercise.payload.duration_sec ?? 30;

  const shuffled = useMemo(
    () => shuffledIndices(items.length, exercise.id),
    [items.length, exercise.id],
  );

  const selected = useMemo<Set<number>>(
    () => new Set((answer as number[]) ?? []),
    [answer],
  );

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (disabled) return;
    const id = window.setInterval(() => {
      setElapsed((e) => (e + 1 >= durationSec ? durationSec : e + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [disabled, durationSec]);

  const toggle = (idx: number) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    onAnswer(Array.from(next));
  };

  const timeLeft = Math.max(0, durationSec - elapsed);
  const isUrgent = timeLeft <= 5 && !disabled;

  return (
    <div className="hot-cold">
      <div className={`hot-cold__timer ${isUrgent ? "is-urgent" : ""}`}>
        <Timer className="w-4 h-4" />
        <span className="hot-cold__timer-value">{timeLeft}s</span>
        <span className="hot-cold__timer-label">
          {disabled ? "Validé" : "Clique sur les signaux chauds"}
        </span>
      </div>

      <div className="hot-cold__grid">
        {shuffled.map((idx) => {
          const item = items[idx]!;
          const isSelected = selected.has(idx);
          return (
            <button
              key={idx}
              type="button"
              className={`hot-cold__item ${isSelected ? "is-selected" : ""}`}
              disabled={disabled}
              onClick={() => toggle(idx)}
            >
              {isSelected && <Flame className="w-3.5 h-3.5" fill="currentColor" />}
              <span>{item.text}</span>
            </button>
          );
        })}
      </div>

      <p className="hot-cold__hint">
        {selected.size === 0
          ? "Tu peux en sélectionner plusieurs."
          : `${selected.size} élément${selected.size > 1 ? "s" : ""} coché${selected.size > 1 ? "s" : ""}.`}
      </p>
    </div>
  );
}
