// academy/src/components/academy/exercises/fill-email.tsx

import { useMemo, useState } from "react";
import { Mail } from "../../../../../frontend/components/icons";

import type { Exercise, Answer } from "../../../lib/model";
import { hashStr } from "../lesson-randomizer";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "slot"; index: number };

function splitTemplate(template: string, blankCount: number): Segment[] {
  const parts = template.split(/(_{3,})/g);
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

export function FillEmailExercise({
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
  const template = exercise.payload.email_template ?? "";
  const blanks = exercise.payload.blanks ?? [];
  const declaredTokens = exercise.payload.tokens ?? [];

  const segments = useMemo(
    () => splitTemplate(template, blanks.length),
    [template, blanks.length],
  );

  const values = useMemo<string[]>(() => {
    const arr = [...(answer as string[])];
    while (arr.length < blanks.length) arr.push("");
    return arr.slice(0, blanks.length);
  }, [answer, blanks.length]);

  const tokens = useMemo(() => {
    const fromDeclared = declaredTokens.filter(Boolean);
    const fromBlanks = blanks
      .flatMap((b) => b.correct)
      .filter(Boolean);
    const unique = Array.from(new Set([...fromDeclared, ...fromBlanks]));
    return unique
      .map((t, i) => ({ t, k: hashStr(exercise.id + ":" + t + ":" + i) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t);
  }, [declaredTokens, blanks, exercise.id]);

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

  return (
    <div className="fill-email">
      <div className="fill-email__card">
        <header className="fill-email__head">
          <Mail className="w-4 h-4" />
          <span>Ton message</span>
        </header>
        <p className="fill-email__body">
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
                className={`fill-email__slot ${v ? "is-filled" : ""} ${
                  isActive ? "is-active" : ""
                }`}
                disabled={disabled}
                onClick={() => (v ? clearSlot(seg.index) : setActiveSlot(seg.index))}
              >
                {v || <span className="fill-email__slot-hint">···</span>}
              </button>
            );
          })}
        </p>
      </div>

      <div className="fill-email__pool">
        <p className="fill-email__pool-label">
          {usedSet.size < tokens.length
            ? `Il reste ${tokens.length - usedSet.size} mot${
                tokens.length - usedSet.size > 1 ? "s" : ""
              } à placer.`
            : "Tous les mots sont placés."}
        </p>
        <div className="fill-email__tokens">
          {tokens.map((t) => {
            const used = usedSet.has(t);
            return (
              <button
                key={t}
                type="button"
                className={`fill-email__token ${used ? "is-used" : ""}`}
                disabled={disabled || used}
                onClick={() => placeToken(t)}
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
