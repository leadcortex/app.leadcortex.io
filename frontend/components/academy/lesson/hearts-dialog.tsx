"use client";

/**
 * Dialogue "Plus de vies" — affiché quand les cœurs atteignent zéro.
 *
 * Deux actions possibles :
 *   - "Retour à l'Academy" : sort proprement (les cœurs se régénèrent
 *     côté backend, 1 cœur / 30 min).
 *   - "Voir les SRS" (optionnel) : proposer une activité alternative
 *     (révisions) qui ne consomme pas de cœurs.
 *
 * Aucun timer côté front — la régénération est gérée par le backend.
 */
import { Heart as HeartIconLucide } from "lucide-react";

import { cn } from "@/lib/utils";

import { Heart } from "../svg/heart";

export type HeartsDialogProps = {
  open: boolean;
  /** Nombre de cœurs actuels (0 dans le cas normal). */
  hearts?: number;
  maxHearts?: number;
  onExit: () => void;
  onReviewSrs?: () => void;
  className?: string;
};

export function HeartsDialog({
  open,
  hearts = 0,
  maxHearts = 5,
  onExit,
  onReviewSrs,
  className,
}: HeartsDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hearts-dialog-title"
      className={cn(
        "fixed inset-0 z-[80] flex items-center justify-center p-4",
        className,
      )}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/85 backdrop-blur-md animate-in fade-in duration-150"
        aria-hidden="true"
      />

      {/* Carte */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-border bg-background p-6 text-center shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-150 md:p-8">
        {/* Icône cœurs */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxHearts }).map((_, i) => (
            <Heart key={i} size={26} variant={i < hearts ? "full" : "empty"} />
          ))}
        </div>

        <div className="space-y-2">
          <h2
            id="hearts-dialog-title"
            className="font-display text-2xl italic leading-tight md:text-3xl"
          >
            Plus de vies
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vous avez utilisé toutes vos vies pour aujourd'hui. Elles se
            régénèrent à raison d'une toutes les 30 minutes.
          </p>
        </div>

        {/* Astuce : révisions SRS */}
        <div className="w-full rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Astuce
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/85">
            Les révisions SRS ne consomment pas de cœurs — idéales pour
            continuer sans attendre.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2">
          {onReviewSrs ? (
            <button
              type="button"
              onClick={onReviewSrs}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground",
                "shadow-md transition-all hover:brightness-110",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <HeartIconLucide className="size-4" strokeWidth={2.2} />
              Réviser le SRS
            </button>
          ) : null}

          <button
            type="button"
            onClick={onExit}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground",
              "transition-colors hover:bg-surface",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            Retour à l'Academy
          </button>
        </div>
      </div>
    </div>
  );
}