//frontend\components\academy\badge-grid.tsx
"use client";

/**
 * Badge Grid — grille des badges obtenus et verrouillés.
 *
 * Utilise le catalogue frontend (lib/academy/badges-catalog.ts) pour les
 * métadonnées visuelles, et `learner.earned_badge_ids` pour le statut.
 *
 * Les badges secrets non obtenus sont affichés comme "???" pour ne pas
 * spoiler leur condition.
 */
import { Check, Lock } from "lucide-react";

import { BADGES_CATALOG } from "@/lib/academy/badges-catalog";
import type { BadgeRarity } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

import { BadgeIcon } from "./badge-icon";

const RARITY_RING: Record<BadgeRarity, string> = {
  common: "ring-1 ring-border",
  rare: "ring-2 ring-sky-400/50",
  epic: "ring-2 ring-violet-500/60",
  legendary: "ring-2 ring-amber-400/70 shadow-[0_0_24px_-6px_rgba(245,166,35,0.6)]",
};

export type BadgeGridProps = {
  earnedIds: string[];
  className?: string;
};

export function BadgeGrid({ earnedIds, className }: BadgeGridProps) {
  const earned = new Set(earnedIds);
  const total = BADGES_CATALOG.length;
  const count = earnedIds.filter((id) =>
    BADGES_CATALOG.some((b) => b.id === id),
  ).length;

  return (
    <section className={cn("space-y-4", className)}>
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold md:text-base">Badges</h2>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {count} / {total}
        </span>
      </header>

      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {BADGES_CATALOG.map((badge) => {
          const isEarned = earned.has(badge.id);
          const isSecret = badge.category === "secret";
          const hidden = isSecret && !isEarned;

          return (
            <li key={badge.id}>
              <div
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-background p-2 text-center transition-all",
                  isEarned ? RARITY_RING[badge.rarity] : "opacity-55",
                )}
                title={hidden ? "Badge secret" : badge.name}
              >
                <span
                  className={cn(
                    "relative grid size-10 place-items-center rounded-full",
                    isEarned ? "bg-surface" : "bg-secondary",
                  )}
                >
                  {hidden ? (
                    <Lock className="size-4 text-muted-foreground" />
                  ) : (
                    <BadgeIcon icon={badge.icon} size={26} />
                  )}
                  {isEarned ? (
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-success text-white ring-2 ring-background">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <p
                  className={cn(
                    "line-clamp-2 text-[10px] leading-tight",
                    isEarned
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {hidden ? "???" : badge.name}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}