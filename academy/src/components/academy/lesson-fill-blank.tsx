// academy/src/components/academy/lesson-fill-blank.tsx

import { useMemo, useState } from "react";

import type { Answer, Exercise } from "../../lib/model";
import { hashStr } from "./lesson-randomizer";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "slot"; index: number };

function splitPrompt(prompt: string, blankCount: number): Segment[] {
  const parts = prompt.split(/(_{3,})/g);
  const out: Segment[] = [];
  let slotIndex = 0;

  for (const part of parts) {
    if (/_{3,}/.test(part)) {
      if (slotIndex < blankCount) {
        out.push({ kind: "slot", index: slotIndex });
        slotIndex++;
      } else {
        out.push({ kind: "text", value: part });
      }
    } else if (part) {
      out.push({ kind: "text", value: part });
    }
  }
  return out;
}

export function FillBlankInline({
  exercise,
  answer,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: string[]) => void;
}) {
  const blanks = exercise.payload.blanks ?? [];
  const segments = useMemo(
    () => splitPrompt(exercise.prompt, blanks.length),
    [exercise.prompt, blanks.length],
  );

  const values = useMemo(() => {
    const v = [...(answer as string[])];
    while (v.length < blanks.length) v.push("");
    return v.slice(0, blanks.length);
  }, [answer, blanks.length]);

  const tokens = useMemo(() => {
    const fromBlanks = blanks.map((b) => b.correct[0] ?? "").filter(Boolean);
    const extra = (
      (exercise.payload as { distractors?: string[] }).distractors ?? []
    ).filter(Boolean);
    const unique = Array.from(new Set([...fromBlanks, ...extra]));
    return unique
      .map((t, i) => ({ t, k: hashStr(exercise.id + ":" + t + ":" + i) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t);
  }, [blanks, exercise]);

  const usedSet = useMemo(
    () => new Set(values.filter(Boolean)),
    [values],
  );
  const [activeSlot, setActiveSlot] = useState(0);

  const placeToken = (token: string) => {
    if (disabled || usedSet.has(token)) return;
    const next = [...values];
    let idx = next.findIndex((v) => !v);
    if (idx === -1) idx = activeSlot;
    next[idx] = token;
    onAnswer(next);
    const nextEmpty = next.findIndex((v, i) => i > idx && !v);
    if (nextEmpty !== -1) setActiveSlot(nextEmpty);
  };

  const clearSlot = (idx: number) => {
    if (disabled) return;
    const next = [...values];
    next[idx] = "";
    onAnswer(next);
    setActiveSlot(idx);
  };

  const focusSlot = (idx: number) => {
    if (disabled) return;
    setActiveSlot(idx);
  };

  return (
    <div className="fill-blank-inline">
      <p className="fill-blank-inline__text">
        {segments.map((seg, i) => {
          if (seg.kind === "text") {
            return <span key={i}>{seg.value}</span>;
          }
          const v = values[seg.index] ?? "";
          const isActive = seg.index === activeSlot;
          return (
            <button
              key={i}
              type="button"
              className={`fill-blank-slot ${v ? "is-filled" : ""} ${
                isActive ? "is-active" : ""
              }`}
              onClick={() =>
                v ? clearSlot(seg.index) : focusSlot(seg.index)
              }
              disabled={disabled}
              aria-label={
                v
                  ? `Emplacement ${seg.index + 1}, contient ${v}. Clique pour retirer.`
                  : `Emplacement ${seg.index + 1}, vide`
              }
            >
              {v || <span className="fill-blank-slot__hint">?</span>}
            </button>
          );
        })}
      </p>

      <div className="fill-blank-pool-inline" role="group" aria-label="Mots disponibles">
        <p className="fill-blank-pool-inline__label">
          {usedSet.size < tokens.length
            ? `Il reste ${tokens.length - usedSet.size} mot${
                tokens.length - usedSet.size > 1 ? "s" : ""
              } à placer.`
            : "Tous les mots sont placés. Vérifie ta réponse."}
        </p>
        <div className="fill-blank-pool-inline__tokens">
          {tokens.map((t) => {
            const used = usedSet.has(t);
            return (
              <button
                key={t}
                type="button"
                className={`block-token ${used ? "block-token--used" : ""}`}
                onClick={() => placeToken(t)}
                disabled={disabled || used}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
