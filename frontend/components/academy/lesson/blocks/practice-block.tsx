"use client";

/**
 * Bloc practice — enchaîne les exercices un par un.
 *
 * État interne :
 *   - `index`     : exercice courant
 *   - `answer`    : réponse en cours (null = non répondu)
 *   - `result`    : résultat de la soumission (null = pas encore soumis)
 *
 * Le CTA de la bottom bar est piloté par ce bloc :
 *   - pas de réponse      → "Vérifier" (désactivé)
 *   - réponse présente    → "Vérifier" (actif)
 *   - soumis              → "Exercice suivant" ou "Continuer" / "Terminer"
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAnswerExercise } from "@/lib/academy/hooks";
import type {
  AnswerExerciseRequest,
  BlockDTO,
  EvaluationResponse,
} from "@/lib/academy/types";

import { useLessonPlayer, type LessonCTASpec } from "../lesson-context";
import { ExerciseRenderer } from "../exercises/exercise-renderer";
import { FeedbackPanel } from "../exercises/feedback-panel";

export function PracticeBlock({ block }: { block: BlockDTO }) {
  const { lesson, isLastBlock, setCTA, advanceBlock, addSessionXP } =
    useLessonPlayer();

  const exercises = block.practice?.exercises ?? [];
  const total = exercises.length;

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerExerciseRequest | null>(null);
  const [result, setResult] = useState<EvaluationResponse | null>(null);

  const exercise = exercises[index];
  const isLastExercise = index === total - 1;

  const answerMutation = useAnswerExercise();

  const submit = useCallback(async () => {
    if (!exercise || !answer) return;
    try {
      const res = await answerMutation.mutateAsync({
        lessonId: lesson.id,
        exerciseId: exercise.id,
        payload: answer,
      });
      setResult(res);
      if (res.correct && res.xp_awarded > 0) {
        addSessionXP(res.xp_awarded);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible d'envoyer la réponse.",
      );
    }
  }, [exercise, answer, answerMutation, lesson.id, addSessionXP]);

  const nextExercise = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1));
    setAnswer(null);
    setResult(null);
  }, [total]);

  /* ─── CTA ────────────────────────────────────────────────────────── */
  const cta = useMemo<LessonCTASpec>(() => {
    if (result) {
      if (isLastExercise) {
        return {
          label: isLastBlock ? "Terminer" : "Continuer",
          kind: isLastBlock ? "finish" : "continue",
          disabled: false,
          onAction: advanceBlock,
        };
      }
      return {
        label: "Exercice suivant",
        kind: "continue",
        disabled: false,
        onAction: nextExercise,
      };
    }
    return {
      label: "Vérifier",
      kind: "verify",
      disabled: !answer || answerMutation.isPending,
      onAction: submit,
    };
  }, [
    result,
    isLastExercise,
    isLastBlock,
    advanceBlock,
    nextExercise,
    answer,
    submit,
    answerMutation.isPending,
  ]);

  useEffect(() => {
    setCTA(cta);
  }, [cta, setCTA]);

  if (!exercise) return null;

  return (
    <article className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Pratique
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {index + 1} / {total}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
        <ExerciseRenderer
          exercise={exercise}
          answer={answer}
          onChange={setAnswer}
          disabled={!!result || answerMutation.isPending}
        />

        {answerMutation.isPending ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Évaluation…
          </div>
        ) : null}

        {result ? <FeedbackPanel result={result} className="mt-6" /> : null}
      </div>
    </article>
  );
}