"use client";

/**
 * MultiSelect — plusieurs bonnes réponses possibles.
 *
 * Contrat : answer = { kind: "multi_select", selected_multiple: number[] }.
 * La sélection est triée pour garantir un résultat déterministe.
 */
import { Check } from "lucide-react";

import type {
  AnswerExerciseRequest,
  ExerciseDTO,
  MultiSelectPayloadDTO,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function MultiSelectExercise({
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
  const payload = exercise.payload as MultiSelectPayloadDTO;
  const selected = new Set(answer?.selected_multiple ?? []);

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange({
      kind: "multi_select",
      selected_multiple: Array.from(next).sort((a, b) => a - b),
    });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-medium leading-relaxed md:text-lg">
        {exercise.prompt}
      </h2>
      <p className="text-[11px] text-muted-foreground">
        Sélectionnez toutes les réponses correctes.
      </p>

      <ul role="listbox" aria-multiselectable="true" className="space-y-2">
        {payload.options.map((opt, i) => {
          const active = selected.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                disabled={disabled}
                onClick={() => toggle(i)}
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
                    "grid size-5 shrink-0 place-items-center rounded-md border",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {active ? <Check className="size-3" strokeWidth={3} /> : null}
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