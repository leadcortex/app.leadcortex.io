"use client";

/**
 * MCQ — QCM à réponse unique.
 *
 * Contrat : answer = { kind: "mcq", selected: number }.
 */
import type { AnswerExerciseRequest, ExerciseDTO, MCqPayloadDTO } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function MCQExercise({
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
  const payload = exercise.payload as MCqPayloadDTO;
  const selected = answer?.selected ?? -1;

  return (
    <div className="space-y-5">
      <h2 className="text-base font-medium leading-relaxed md:text-lg">
        {exercise.prompt}
      </h2>

      <ul role="radiogroup" className="space-y-2">
        {payload.options.map((opt, i) => {
          const active = i === selected;
          return (
            <li key={i}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange({ kind: "mcq", selected: i })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/[0.06] font-medium shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-surface/50",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-mono font-semibold",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">{opt}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}