"use client";

/**
 * Écran de fin de leçon.
 *
 * Déclenché par le Lesson Player quand le dernier bloc est franchi.
 * Affiche :
 *   - confetti (SVG, 42 particules)
 *   - titre + sous-titre
 *   - 3 cartes stats : XP gagné / streak / niveau
 *   - section "Déblocages" (badges + avatars) — optionnelle
 *   - CTA principal "Continuer" (leçon suivante ou retour Academy)
 *   - lien secondaire "Retour à l'Academy"
 *
 * Aucun emoji. Les icônes sont les SVG du dossier `svg/`.
 */
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Confetti } from "../svg/confetti";
import { Flame } from "../svg/flame";
import { Crown } from "../svg/crown";
import { Star } from "../svg/star";

export type EndOfLessonProps = {
  lessonTitle: string;
  sessionXP: number;
  streakDays: number;
  level: number;
  /** Badges gagnés pendant cette leçon (si le backend en a émis). */
  badgeIds?: string[];
  /** Avatars débloqués pendant cette leçon. */
  avatarIds?: string[];
  /** Label du CTA principal (par défaut : "Continuer"). */
  primaryLabel?: string;
  onContinue?: () => void;
  onExit?: () => void;
  className?: string;
};

export function EndOfLesson({
  lessonTitle,
  sessionXP,
  streakDays,
  level,
  badgeIds = [],
  avatarIds = [],
  primaryLabel = "Continuer",
  onContinue,
  onExit,
  className,
}: EndOfLessonProps) {
  const hasUnlocks = badgeIds.length > 0 || avatarIds.length > 0;

  return (
    <div
      className={cn(
        "relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-10 text-center",
        className,
      )}
    >
      {/* Confetti en overlay — non bloquant. */}
      <Confetti count={42} seed={lessonTitle.length + sessionXP} duration={2.8} />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Titre */}
        <header className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Leçon terminée
          </p>
          <h1 className="font-display text-3xl italic leading-tight md:text-5xl">
            Bravo !
          </h1>
          <p className="text-sm text-muted-foreground">{lessonTitle}</p>
        </header>

        {/* Stats — 3 cartes */}
        <section className="grid w-full grid-cols-3 gap-3">
          <StatCard
            icon={<Star size={22} />}
            label="XP gagné"
            value={`+${sessionXP}`}
            tone="primary"
          />
          <StatCard
            icon={<Flame size={22} />}
            label="Série"
            value={`${streakDays} j`}
            tone="warm"
          />
          <StatCard
            icon={<Crown size={22} />}
            label="Niveau"
            value={String(level)}
            tone="gold"
          />
        </section>

        {/* Déblocages */}
        {hasUnlocks ? (
          <section className="w-full space-y-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Déblocages
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {badgeIds.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-medium text-primary"
                >
                  Badge · {id}
                </span>
              ))}
              {avatarIds.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-medium text-primary"
                >
                  Avatar · {id}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* CTA */}
        <section className="flex w-full flex-col items-stretch gap-2">
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground",
                "shadow-md transition-all hover:brightness-110",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              {primaryLabel}
              <ChevronRight className="size-4" strokeWidth={2.4} />
            </button>
          ) : null}

          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-6 text-sm font-medium text-foreground",
                "transition-colors hover:bg-surface",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              Retour à l'Academy
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

type StatTone = "primary" | "warm" | "gold";

const TONE_STYLES: Record<StatTone, string> = {
  primary: "border-primary/25 bg-primary/[0.05]",
  warm: "border-warning/30 bg-warning/[0.05]",
  gold: "border-amber-400/30 bg-amber-400/[0.05]",
};

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: StatTone;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl border p-3 md:p-4",
        TONE_STYLES[tone],
      )}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-background shadow-sm">
        {icon}
      </span>
      <p className="font-display text-xl tabular-nums md:text-2xl">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}