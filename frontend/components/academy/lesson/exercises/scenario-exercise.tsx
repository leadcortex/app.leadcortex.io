"use client";

/**
 * Scenario — cas pratique à plusieurs étapes.
 *
 * L'apprenant traverse les étapes une par une, choisit une option, voit
 * l'explication éventuelle, puis passe à l'étape suivante. À la fin,
 * toutes les `choices` sont envoyées d'un coup via onChange.
 *
 * Contrat : answer = { kind: "scenario", choices: number[] }.
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import type {
  AnswerExerciseRequest,
  ExerciseDTO,
  ScenarioPayloadDTO,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function ScenarioExercise({
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
  const payload = exercise.payload as ScenarioPayloadDTO;
  const total = payload.steps.length;

  const [stepIndex, setStepIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(() => {
    const c = answer?.choices;
    return c && c.length > 0 ? (c[0] ?? null) : null;
  });

  const step = payload.steps[stepIndex];

  // Réinitialise picked à chaque changement d'étape (sauf si déjà défini).
  useEffect(() => {
    const c = answer?.choices;
    if (c && c.length > stepIndex) setPicked(c[stepIndex] ?? null);
    else setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const choices = useMemo<number[]>(() => {
    const base = [...(answer?.choices ?? [])];
    while (base.length < total) base.push(-1);
    return base.slice(0, total);
  }, [answer?.choices, total]);

  const commit = (next: number[]) => {
    onChange({ kind: "scenario", choices: next });
  };

  const pick = (choiceIdx: number) => {
    if (disabled || picked !== null) return;
    setPicked(choiceIdx);
    const next = [...choices];
    next[stepIndex] = choiceIdx;
    commit(next);
  };

  const next = () => {
    if (stepIndex < total - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const isLast = stepIndex >= total - 1;
  const canAdvance = picked !== null && !isLast;

  if (!step) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium leading-relaxed md:text-lg">
          {exercise.prompt}
        </h2>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          Étape {stepIndex + 1} / {total}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface/30 p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Situation
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{step.situation}</p>
        <p className="mt-4 text-sm font-medium">{step.question}</p>
      </div>

      <ul className="space-y-2">
        {step.choices.map((choice, i) => {
          const active = picked === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={disabled || picked !== null}
                onClick={() => pick(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/[0.06] font-medium shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-surface/50",
                  (disabled || picked !== null) && !active && "cursor-not-allowed opacity-60",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-mono",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">{choice}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {canAdvance ? (
        <button
          type="button"
          onClick={next}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium",
            "transition-colors hover:bg-surface",
          )}
        >
          Étape suivante
          <ChevronRight className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}