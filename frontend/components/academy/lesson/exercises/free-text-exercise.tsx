"use client";

/**
 * FreeText — réponse ouverte, évaluée par heuristique locale (mots-clés,
 * longueur). En prod, sera remplacée par un scorer LLM côté backend.
 *
 * Contrat : answer = { kind: "free_text", text: string }.
 */
import { useMemo } from "react";

import type {
  AnswerExerciseRequest,
  ExerciseDTO,
  FreeTextPayloadDTO,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function FreeTextExercise({
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
  const payload = exercise.payload as FreeTextPayloadDTO;
  const text = answer?.text ?? "";
  const words = useMemo(() => countWords(text), [text]);

  const belowMin = words < payload.min_words;
  const aboveMax = payload.max_words > 0 && words > payload.max_words;

  return (
    <div className="space-y-5">
      <h2 className="text-base font-medium leading-relaxed md:text-lg">
        {exercise.prompt}
      </h2>

      <textarea
        disabled={disabled}
        value={text}
        onChange={(e) => onChange({ kind: "free_text", text: e.target.value })}
        placeholder="Rédigez votre réponse…"
        rows={6}
        className={cn(
          "w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span
          className={cn(
            "font-mono tabular-nums",
            belowMin || aboveMax ? "text-warning" : "text-muted-foreground",
          )}
        >
          {words} mot{words > 1 ? "s" : ""}
          {payload.min_words > 0 ? ` · min ${payload.min_words}` : ""}
          {payload.max_words > 0 ? ` · max ${payload.max_words}` : ""}
        </span>
        {belowMin ? (
          <span className="text-warning">Réponse trop courte</span>
        ) : aboveMax ? (
          <span className="text-warning">Réponse trop longue</span>
        ) : (
          <span className="text-success">Longueur OK</span>
        )}
      </div>
    </div>
  );
}