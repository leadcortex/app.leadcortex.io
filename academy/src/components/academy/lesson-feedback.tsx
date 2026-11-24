// academy/src/components/academy/lesson-feedback.tsx

import { useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  XCircle,
} from "../../../../frontend/components/icons";

import { Button } from "../ui/button";
import type { Exercise } from "../../lib/model";
import type { FeedbackMessage, ProgressiveHint } from "./lesson-messages";
import { pickProgressiveHint } from "./lesson-messages";

export type FeedbackKind = "correct" | "incorrect" | "review";

export type FeedbackOverlayProps = {
  feedback: FeedbackKind;
  message: FeedbackMessage;
  exercise: Exercise;
  answer: unknown;
  failCount: number;
  exhausted: boolean;
  onContinue: () => void;
  onRetry: () => void;
  onSkip: () => void;
};

export function FeedbackOverlay({
  feedback,
  message,
  exercise,
  answer,
  failCount,
  exhausted,
  onContinue,
  onRetry,
  onSkip,
}: FeedbackOverlayProps) {
  const hint: ProgressiveHint =
    feedback === "incorrect"
      ? pickProgressiveHint({ exercise, failCount })
      : { level: 1, text: "" };

  const showSolution = hint.level === 3;
  const isCorrect = feedback === "correct";
  const isReview = feedback === "review";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Enter") return;
      if (isCorrect) {
        onContinue();
      } else if (feedback === "incorrect") {
        if (exhausted) onSkip();
        else onRetry();
      } else if (isReview) {
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCorrect, isReview, feedback, exhausted, onContinue, onRetry, onSkip]);

  return (
    <div
      className={`lesson-feedback-root lesson-feedback-root--${feedback}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-feedback-title"
    >
      <div
        className="lesson-feedback-backdrop"
        onClick={
          isCorrect
            ? onContinue
            : exhausted
              ? onSkip
              : onRetry
        }
        aria-hidden="true"
      />

      <div className="lesson-feedback-card">
        <header className="lesson-feedback-header">
          <span className="lesson-feedback-icon">
            {isCorrect ? (
              <CheckCircle2 strokeWidth={2.5} />
            ) : isReview ? (
              <Lightbulb strokeWidth={2.5} />
            ) : (
              <XCircle strokeWidth={2.5} />
            )}
          </span>
          <div className="lesson-feedback-title">
            <h2 id="lesson-feedback-title">{message.title}</h2>
            {message.subtitle && <p>{message.subtitle}</p>}
          </div>
        </header>

        <div className="lesson-feedback-body">
          {feedback === "incorrect" && !showSolution && hint.text && (
            <div className={`lesson-feedback-hint level-${hint.level}`}>
              <div className="lesson-feedback-hint__label">
                <Lightbulb className="w-4 h-4" />
                {hint.level === 1 ? "Indice" : "Indice renforcé"}
              </div>
              <p>{hint.text}</p>
            </div>
          )}

          {feedback === "incorrect" && showSolution && (
            <MistakeDetail exercise={exercise} answer={answer} />
          )}

          {exercise.explanation_md && !showSolution && (
            <div className="lesson-feedback-explanation">
              <div className="lesson-feedback-explanation__label">
                {isCorrect ? "Pourquoi c'est juste" : "Ce qu'il faut retenir"}
              </div>
              <p>{exercise.explanation_md}</p>
            </div>
          )}

          {showSolution && exercise.explanation_md && (
            <div className="lesson-feedback-explanation">
              <div className="lesson-feedback-explanation__label">
                Pourquoi c'est la bonne réponse
              </div>
              <p>{exercise.explanation_md}</p>
            </div>
          )}

          {isReview && (
            <div className="lesson-feedback-explanation">
              <div className="lesson-feedback-explanation__label">
                Critères d'auto-évaluation
              </div>
              <p>{exercise.payload.rubric_md ?? "Pas de grille fournie."}</p>
            </div>
          )}
        </div>

        <footer className="lesson-feedback-actions">
          {isCorrect && (
            <Button variant="academy" onClick={onContinue}>
              Continuer <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {feedback === "incorrect" && !exhausted && (
            <Button variant="academy" onClick={onRetry}>
              <RotateCcw className="w-4 h-4" /> Réessayer
            </Button>
          )}

          {feedback === "incorrect" && exhausted && (
            <Button variant="academy" onClick={onSkip}>
              Utiliser la solution <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {isReview && (
            <Button variant="academy" onClick={onContinue}>
              Valider ma réponse <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

function MistakeDetail({
  exercise,
  answer,
}: {
  exercise: Exercise;
  answer: unknown;
}) {
  switch (exercise.kind) {
    case "mcq":
      return <McqDetail exercise={exercise} answer={answer} />;
    case "multi_select":
      return <MultiSelectDetail exercise={exercise} answer={answer} />;
    case "fill_blank":
      return <FillBlankDetail exercise={exercise} answer={answer} />;
    case "order_steps":
      return <OrderStepsDetail exercise={exercise} answer={answer} />;
    case "match_pairs":
      return <MatchPairsDetail exercise={exercise} />;
    case "scenario":
      return <ScenarioDetail exercise={exercise} answer={answer} />;
    default:
      return null;
  }
}

function McqDetail({ exercise, answer }: { exercise: Exercise; answer: unknown }) {
  const selected = (answer as number[])[0] ?? -1;
  const correct = exercise.payload.correct as number;
  const options = exercise.payload.options ?? [];
  return (
    <div className="lesson-feedback-detail">
      <div className="lesson-feedback-detail__label">
        <AlertCircle className="w-4 h-4" /> La bonne réponse
      </div>
      <ul className="lesson-feedback-options">
        {options.map((opt, i) => {
          const isUser = i === selected;
          const isRight = i === correct;
          const cls = isRight ? "is-correct" : isUser ? "is-wrong" : "";
          return (
            <li key={i} className={`lesson-feedback-option ${cls}`}>
              <span className="lesson-feedback-option__letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="lesson-feedback-option__text">{opt}</span>
              {isRight && (
                <span className="lesson-feedback-option__badge is-correct">
                  <CheckCircle2 className="w-4 h-4" /> Bonne
                </span>
              )}
              {isUser && !isRight && (
                <span className="lesson-feedback-option__badge is-wrong">
                  <XCircle className="w-4 h-4" /> Ton choix
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MultiSelectDetail({
  exercise,
  answer,
}: {
  exercise: Exercise;
  answer: unknown;
}) {
  const selected = new Set((answer as number[]) ?? []);
  const correct = new Set((exercise.payload.correct as number[]) ?? []);
  const options = exercise.payload.options ?? [];
  return (
    <div className="lesson-feedback-detail">
      <div className="lesson-feedback-detail__label">
        <AlertCircle className="w-4 h-4" /> Détail de la sélection
      </div>
      <ul className="lesson-feedback-options">
        {options.map((opt, i) => {
          const picked = selected.has(i);
          const should = correct.has(i);
          let cls = "";
          let badge: React.ReactNode = null;
          if (picked && should) {
            cls = "is-correct";
            badge = (
              <span className="lesson-feedback-option__badge is-correct">
                <CheckCircle2 className="w-4 h-4" /> Correct
              </span>
            );
          } else if (picked && !should) {
            cls = "is-wrong";
            badge = (
              <span className="lesson-feedback-option__badge is-wrong">
                <XCircle className="w-4 h-4" /> En trop
              </span>
            );
          } else if (!picked && should) {
            cls = "is-missing";
            badge = (
              <span className="lesson-feedback-option__badge is-missing">
                <AlertCircle className="w-4 h-4" /> Manquait
              </span>
            );
          }
          return (
            <li key={i} className={`lesson-feedback-option ${cls}`}>
              <span className="lesson-feedback-option__letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="lesson-feedback-option__text">{opt}</span>
              {badge}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FillBlankDetail({
  exercise,
  answer,
}: {
  exercise: Exercise;
  answer: unknown;
}) {
  const values = (answer as string[]) ?? [];
  const blanks = exercise.payload.blanks ?? [];
  return (
    <div className="lesson-feedback-detail">
      <div className="lesson-feedback-detail__label">
        <AlertCircle className="w-4 h-4" /> Trou par trou
      </div>
      <ul className="lesson-feedback-options">
        {blanks.map((b, i) => {
          const got = (values[i] ?? "").trim();
          const expected = b.correct?.[0] ?? "";
          const isCorrect = b.correct?.some(
            (c) => c.toLowerCase().trim() === got.toLowerCase(),
          ) ?? false;
          return (
            <li
              key={i}
              className={`lesson-feedback-option ${
                isCorrect ? "is-correct" : "is-wrong"
              }`}
            >
              <span className="lesson-feedback-option__letter">{i + 1}</span>
              <span className="lesson-feedback-option__text">
                <strong>Toi :</strong> « {got || "—"} »
                {!isCorrect && (
                  <>
                    {" "}— <strong>Attendu :</strong> « {expected} »
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OrderStepsDetail({
  exercise,
  answer,
}: {
  exercise: Exercise;
  answer: unknown;
}) {
  const steps = exercise.payload.steps ?? [];
  const userOrder = (answer as number[]) ?? [];
  return (
    <div className="lesson-feedback-detail">
      <div className="lesson-feedback-detail__label">
        <AlertCircle className="w-4 h-4" /> L'ordre correct
      </div>
      <ol className="lesson-feedback-options">
        {steps.map((step, i) => {
          const userPos = userOrder.indexOf(i);
          const isCorrect = userPos === i;
          return (
            <li
              key={i}
              className={`lesson-feedback-option ${
                isCorrect ? "is-correct" : "is-wrong"
              }`}
            >
              <span className="lesson-feedback-option__letter">{i + 1}</span>
              <span className="lesson-feedback-option__text">{step}</span>
              {!isCorrect && userPos !== -1 && (
                <span className="lesson-feedback-option__badge is-wrong">
                  <XCircle className="w-4 h-4" /> Toi : {userPos + 1}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MatchPairsDetail({ exercise }: { exercise: Exercise }) {
  const pairs = exercise.payload.pairs ?? [];
  return (
    <div className="lesson-feedback-detail">
      <div className="lesson-feedback-detail__label">
        <AlertCircle className="w-4 h-4" /> Les bonnes associations
      </div>
      <ul className="lesson-feedback-options">
        {pairs.map((p, i) => (
          <li key={i} className="lesson-feedback-option is-correct">
            <span className="lesson-feedback-option__letter">{i + 1}</span>
            <span className="lesson-feedback-option__text">
              <strong>{p.left}</strong> correspond à <strong>{p.right}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioDetail({
  exercise,
  answer,
}: {
  exercise: Exercise;
  answer: unknown;
}) {
  const steps = exercise.payload.steps ?? [];
  const userChoices = (answer as number[]) ?? [];
  return (
    <div className="lesson-feedback-detail">
      <div className="lesson-feedback-detail__label">
        <AlertCircle className="w-4 h-4" /> Tes choix par étape
      </div>
      <ul className="lesson-feedback-options">
        {steps.map((step, i) => {
          const userChoice = userChoices[i] ?? -1;
          const correctIdx = step.choices.findIndex((c) => c.correct);
          const isCorrect = userChoice === correctIdx;
          return (
            <li
              key={i}
              className={`lesson-feedback-option ${
                isCorrect ? "is-correct" : "is-wrong"
              }`}
            >
              <span className="lesson-feedback-option__letter">{i + 1}</span>
              <span className="lesson-feedback-option__text">
                {isCorrect ? (
                  <>
                    Tu as choisi : « {step.choices[userChoice]?.label ?? "—"} » ✓
                  </>
                ) : (
                  <>
                    Tu as choisi « {step.choices[userChoice]?.label ?? "—"} » — il
                    fallait « {step.choices[correctIdx]?.label ?? "—"} »
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
