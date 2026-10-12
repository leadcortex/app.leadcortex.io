"use client";

/**
 * FillBlank — texte à trous.
 *
 * Contrat : answer = { kind: "fill_blank", blanks: string[] }.
 * L'ordre des strings correspond aux trous du payload.
 */
import { useMemo } from "react";

import type {
  AnswerExerciseRequest,
  ExerciseDTO,
  FillBlankPayloadDTO,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function FillBlankExercise({
  exercise,
  answer,
  onChange,
  disabled,
}: {
  exercise: ExerciseDTO;
  answer: AnswerExerciseRequest | null;
  onChange: (a: AnswerExerciseRequest) => void;
  disabled?: boolean;
}) {
  const payload = exercise.payload as FillBlankPayloadDTO;
  const blanks = useMemo(() => {
    const base = [...(answer?.blanks ?? [])];
    while (base.length < payload.blank_count) base.push("");
    return base.slice(0, payload.blank_count);
  }, [answer?.blanks, payload.blank_count]);

  const setAt = (i: number, v: string) => {
    const next = [...blanks];
    next[i] = v;
    onChange({ kind: "fill_blank", blanks: next });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-medium leading-relaxed md:text-lg">
        {exercise.prompt}
      </h2>

      <div className="space-y-3">
        {blanks.map((value, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 font-mono text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <input
              type="text"
              disabled={disabled}
              value={value}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={`Trou ${i + 1}`}
              className={cn(
                "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                disabled && "cursor-not-allowed opacity-60",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}