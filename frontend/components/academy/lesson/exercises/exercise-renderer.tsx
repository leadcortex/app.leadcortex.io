"use client";

/**
 * Exercise Renderer — dispatch par `kind` vers le composant dédié.
 *
 * Chaque composant reçoit la réponse courante (`answer`) et émet une
 * nouvelle réponse typée via `onChange`. Le parent (PracticeBlock) gère
 * la soumission et le résultat.
 *
 * Le contrat d'`AnswerExerciseRequest` est défini dans lib/academy/types.ts :
 *   { kind, selected, selected_multiple, blanks, steps, pairs, text, choices }
 */
import type { AnswerExerciseRequest, ExerciseDTO } from "@/lib/academy/types";

import { MCQExercise } from "./mcq-exercise";
import { MultiSelectExercise } from "./multi-select-exercise";
import { FillBlankExercise } from "./fill-blank-exercise";
import { OrderStepsExercise } from "./order-steps-exercise";
import { MatchPairsExercise } from "./match-pairs-exercise";
import { FreeTextExercise } from "./free-text-exercise";
import { ScenarioExercise } from "./scenario-exercise";

export type ExerciseRendererProps = {
  exercise: ExerciseDTO;
  answer: AnswerExerciseRequest | null;
  onChange: (answer: AnswerExerciseRequest) => void;
  disabled?: boolean;
};

export function ExerciseRenderer({
  exercise,
  answer,
  onChange,
  disabled,
}: ExerciseRendererProps) {
  switch (exercise.kind) {
    case "mcq":
      return (
        <MCQExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "multi_select":
      return (
        <MultiSelectExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "fill_blank":
      return (
        <FillBlankExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "order_steps":
      return (
        <OrderStepsExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "match_pairs":
      return (
        <MatchPairsExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "free_text":
      return (
        <FreeTextExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "scenario":
      return (
        <ScenarioExercise
          exercise={exercise}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "in_app_mission":
      // Les missions in-app ne sont pas évaluées ici — voir MissionBlock.
      return null;
    default:
      return (
        <div className="rounded-xl border border-dashed border-border bg-surface/30 p-5 text-sm text-muted-foreground">
          Type d'exercice non supporté.
        </div>
      );
  }
}