// academy/src/components/academy/exercises/timeline.tsx

import { useMemo, useState } from "react";
import { GripVertical } from "../../../../../frontend/components/icons";

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

export function TimelineExercise({
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
  const events = exercise.payload.events ?? [];
  const shuffled = useMemo(
    () => shuffledIndices(events.length, exercise.id),
    [events.length, exercise.id],
  );

  const [activeEvent, setActiveEvent] = useState<number | null>(null);

  const placed = useMemo<number[]>(() => {
    const arr = [...(answer as number[])];
    while (arr.length < events.length) arr.push(-1);
    return arr;
  }, [answer, events.length]);

  const positionMap = useMemo(() => {
    const map = new Map<number, number>();
    placed.forEach((pos, evIdx) => {
      if (pos >= 0) map.set(pos, evIdx);
    });
    return map;
  }, [placed]);

  const place = (eventIdx: number, position: number) => {
    if (disabled) return;
    const next = [...placed];
    const occupant = positionMap.get(position);
    if (occupant !== undefined && occupant !== eventIdx) {
      next[occupant] = -1;
    }
    next[eventIdx] = position;
    onAnswer(next);
    setActiveEvent(null);
  };

  const unplace = (eventIdx: number) => {
    if (disabled) return;
    const next = [...placed];
    next[eventIdx] = -1;
    onAnswer(next);
    setActiveEvent(eventIdx);
  };

  return (
    <div className="timeline">
      <div className="timeline__track">
        {events.map((_, pos) => {
          const evIdx = positionMap.get(pos);
          const hasItem = evIdx !== undefined;
          return (
            <div key={pos} className="timeline__slot-wrap">
              <div className="timeline__slot-marker">
                <span>{pos + 1}</span>
              </div>
              <button
                type="button"
                className={`timeline__slot ${hasItem ? "is-filled" : ""} ${
                  activeEvent !== null && !hasItem ? "is-target" : ""
                }`}
                onClick={() => {
                  if (activeEvent !== null) place(activeEvent, pos);
                  else if (evIdx !== undefined) unplace(evIdx);
                }}
                disabled={disabled}
              >
                {hasItem ? (
                  <span className="timeline__slot-text">
                    {events[evIdx]!.text}
                  </span>
                ) : (
                  <span className="timeline__slot-hint">?</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="timeline__pool">
        <p className="timeline__pool-label">
          {positionMap.size < events.length
            ? `Il reste ${
                events.length - positionMap.size
              } étape${events.length - positionMap.size > 1 ? "s" : ""} à placer.`
            : "Toutes les étapes sont placées."}
        </p>
        <div className="timeline__tokens">
          {shuffled.map((evIdx) => {
            if (placed[evIdx]! >= 0) return null;
            const isActive = activeEvent === evIdx;
            return (
              <button
                key={evIdx}
                type="button"
                className={`timeline__token ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveEvent(isActive ? null : evIdx)}
                disabled={disabled}
              >
                <GripVertical className="w-3.5 h-3.5 opacity-50" />
                {events[evIdx]!.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
