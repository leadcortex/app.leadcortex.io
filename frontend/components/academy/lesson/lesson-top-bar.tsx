"use client";

/**
 * Barre supérieure du Lesson Player.
 *
 * Contient :
 *   - bouton quitter (retour à l'Academy)
 *   - barre de progression (blocs complétés / total)
 *   - compteur de cœurs (5 max)
 *   - compteur d'XP de session
 *
 * Consomme le contexte LessonPlayer pour rester en phase avec l'état réel.
 */
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Heart } from "../svg/heart";
import { Star } from "../svg/star";
import { useLessonPlayer } from "./lesson-context";

export function LessonTopBar() {
  const {
    blockIndex,
    totalBlocks,
    hearts,
    maxHearts,
    sessionXP,
    requestExit,
  } = useLessonPlayer();

  // Progression : nombre de blocs entièrement terminés.
  // Le bloc courant n'est pas compté tant qu'on ne l'a pas avancé.
  const ratio = totalBlocks > 0 ? blockIndex / totalBlocks : 0;
  const pct = Math.max(4, Math.round(ratio * 100));

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:px-5 md:py-4">
      {/* Quitter */}
      <button
        type="button"
        onClick={requestExit}
        aria-label="Quitter la leçon"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          "text-muted-foreground transition-colors",
          "hover:bg-surface hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <X className="size-4" strokeWidth={2.2} />
      </button>

      {/* Barre de progression */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Progression de la leçon"
        className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Cœurs */}
      <div
        className="flex shrink-0 items-center gap-0.5"
        aria-label={`${hearts} vies sur ${maxHearts}`}
      >
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart
            key={i}
            size={18}
            variant={i < hearts ? "full" : "empty"}
            title={i < hearts ? "Vie disponible" : "Vie perdue"}
          />
        ))}
      </div>

      {/* XP de session */}
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
        <Star size={14} />
        <span className="font-mono text-xs font-semibold tabular-nums">{sessionXP}</span>
      </div>
    </header>
  );
}