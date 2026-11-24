// academy/src/components/academy/srs-review.tsx

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Check,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from "../../../../frontend/components/icons";

import { Button } from "../ui/button";
import { Avatar } from "./illustrations";
import { useSrsQueue, useSrsReview, type SrsCardDTO } from "../../hooks/use-srs";

type Phase = "front" | "back";

export type SrsReviewProps = {
  avatar: string;
  learnerId?: string;
  onClose: () => void;
};

export function SrsReview({ avatar, learnerId, onClose }: SrsReviewProps) {
  const { cards, isLoading, isFallback, refetch } = useSrsQueue(learnerId);
  const reviewMutation = useSrsReview(learnerId);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("front");
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current: SrsCardDTO | undefined = cards[index];
  const isDone = !current;

  const progressPct = useMemo(() => {
    if (cards.length === 0) return 10;
    const ratio = (index + (phase === "back" ? 0.5 : 0)) / cards.length;
    return Math.max(1, Math.min(10, Math.round(ratio * 10)));
  }, [index, phase, cards.length]);

  const flip = () => setPhase("back");

  const rate = async (button: "again" | "hard" | "good" | "easy") => {
    if (!current) return;
    try {
      await reviewMutation.mutateAsync({ cardId: current.id, button });
    } catch {
    }
    setReviewedCount((n) => n + 1);
    setPhase("front");
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setPhase("front");
    setReviewedCount(0);
    refetch();
  };

  const content = (
    <div
      className="academy lesson-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Révisions espacées"
    >
      <header className="lesson-header">
        <Button variant="academyNav" aria-label="Quitter les révisions" onClick={onClose}>
          <X />
        </Button>
        <div className="progress-track">
          <div className={`progress-fill lesson-progress-${progressPct}`} />
        </div>
        <span className="step-count">
          {index + 1} / {cards.length || "—"}
        </span>
      </header>

      <p className="lesson-title">
        Révisions espacées · {cards.length} carte{cards.length > 1 ? "s" : ""} à revoir
      </p>

      <main className="lesson-body lesson-body--centered">
        {isLoading && (
          <div className="mascot-dialogue">
            <Avatar kind={avatar} />
            <div className="speech-bubble">Chargement de tes révisions…</div>
          </div>
        )}

        {!isLoading && isDone && (
          <SessionEnd
            avatar={avatar}
            reviewedCount={reviewedCount}
            totalCards={cards.length}
            isFallback={isFallback}
            onRestart={restart}
            onClose={onClose}
          />
        )}

        {!isLoading && current && (
          <SrsCardView
            key={current.id}
            card={current}
            phase={phase}
            avatar={avatar}
            onFlip={flip}
            onRate={rate}
            busy={reviewMutation.isPending}
          />
        )}
      </main>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}

function SrsCardView({
  card,
  phase,
  avatar,
  onFlip,
  onRate,
  busy,
}: {
  card: SrsCardDTO;
  phase: Phase;
  avatar: string;
  onFlip: () => void;
  onRate: (button: "again" | "hard" | "good" | "easy") => void;
  busy: boolean;
}) {
  const faceText = phase === "front" ? card.front : card.back;

  return (
    <div className="lesson-exercise" style={{ width: "100%", maxWidth: 640 }}>
      <div className="mascot-dialogue">
        <Avatar kind={avatar} />
        <div className="speech-bubble">
          {phase === "front"
            ? "Souviens-toi de la réponse. Puis retourne la carte."
            : "Évalue honnêtement ta réponse."}
        </div>
      </div>

      <button
        type="button"
        onClick={phase === "front" ? onFlip : undefined}
        aria-label={phase === "front" ? "Retourner la carte" : "Réponse affichée"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 220,
          padding: "32px 24px",
          marginTop: 8,
          background: "var(--academy-paper)",
          border: "2px solid var(--academy-line)",
          borderRadius: "var(--r-lg)",
          boxShadow: "0 4px 0 var(--academy-line)",
          cursor: phase === "front" ? "pointer" : "default",
          fontFamily: "var(--font-academy)",
          fontSize: 20,
          fontWeight: 800,
          color: "var(--academy-ink)",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        <span>{faceText}</span>
      </button>

      {phase === "front" && (
        <p className="step-count" style={{ textAlign: "center", marginTop: 12 }}>
          Clique sur la carte pour révéler la réponse
        </p>
      )}

      {phase === "back" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 20,
          }}
        >
          <Button
            variant="academyOutline"
            onClick={() => onRate("again")}
            disabled={busy}
          >
            <RotateCcw className="w-4 h-4" />
            Encore
          </Button>
          <Button
            variant="academyOutline"
            onClick={() => onRate("hard")}
            disabled={busy}
          >
            <ThumbsDown className="w-4 h-4" />
            Difficile
          </Button>
          <Button variant="academy" onClick={() => onRate("good")} disabled={busy}>
            <ThumbsUp className="w-4 h-4" />
            Bien
          </Button>
          <Button variant="academy" onClick={() => onRate("easy")} disabled={busy}>
            <Zap className="w-4 h-4" />
            Facile
          </Button>
        </div>
      )}
    </div>
  );
}

function SessionEnd({
  avatar,
  reviewedCount,
  totalCards,
  isFallback,
  onRestart,
  onClose,
}: {
  avatar: string;
  reviewedCount: number;
  totalCards: number;
  isFallback: boolean;
  onRestart: () => void;
  onClose: () => void;
}) {
  const nothingDue = totalCards === 0;

  return (
    <div className="celebration animate-success">
      <Avatar kind={avatar} />
      <h2>
        {nothingDue
          ? "Tu es à jour !"
          : reviewedCount > 0
            ? "Session terminée"
            : "Rien à réviser"}
      </h2>
      <p className="step-count">
        {nothingDue
          ? "Aucune carte n'est due pour le moment. Reviens plus tard."
          : `Tu as révisé ${reviewedCount} carte${reviewedCount > 1 ? "s" : ""}.`}
      </p>

      {isFallback && (
        <p className="step-count" style={{ opacity: 0.7 }}>
          (mode hors-ligne — les révisions seront synchronisées plus tard)
        </p>
      )}

      <div className="result-stats">
        <div className="result-stat">
          <small>Cartes révisées</small>
          <strong>{reviewedCount}</strong>
        </div>
        <div className="result-stat">
          <small>Restantes</small>
          <strong>{Math.max(0, totalCards - reviewedCount)}</strong>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        {!nothingDue && reviewedCount < totalCards && (
          <Button variant="academyOutline" onClick={onRestart}>
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </Button>
        )}
        <Button variant="academy" onClick={onClose}>
          <Check className="w-4 h-4" />
          Terminer
        </Button>
      </div>

      {nothingDue && (
        <p className="step-count" style={{ marginTop: 16 }}>
          <Sparkles className="w-3.5 h-3.5" style={{ display: "inline", marginRight: 6 }} />
          Le savoir se construit par petites touches.
        </p>
      )}

      {!nothingDue && reviewedCount > 0 && (
        <p className="step-count" style={{ marginTop: 16 }}>
          <BookOpen className="w-3.5 h-3.5" style={{ display: "inline", marginRight: 6 }} />
          Reviens demain pour consolider.
        </p>
      )}
    </div>
  );
}
