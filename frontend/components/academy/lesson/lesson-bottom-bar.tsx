"use client";

/**
 * Barre inférieure du Lesson Player.
 *
 * Affiche le CTA unique — label / kind / action sont pilotés par
 * `cta: LessonCTASpec` du contexte, que les blocs peuvent surcharger.
 */
import { Check, ChevronRight, Flag } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLessonPlayer } from "./lesson-context";

export function LessonBottomBar() {
  const { cta } = useLessonPlayer();

  const { label, kind, disabled, onAction } = cta;

  return (
    <footer className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:px-6 md:py-4">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
        {kind === "verify" && disabled ? (
          <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground md:inline-flex">
            <Flag className="size-3.5" />
            Répondez pour vérifier
          </span>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={() => void onAction()}
          className={cn(
            "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            disabled && "cursor-not-allowed bg-secondary text-muted-foreground/60 shadow-none",
            !disabled && kind === "verify" && "bg-primary text-primary-foreground shadow-md hover:brightness-110 focus-visible:ring-primary",
            !disabled && kind === "continue" && "bg-primary text-primary-foreground shadow-md hover:brightness-110 focus-visible:ring-primary",
            !disabled && kind === "finish" && "bg-success text-white shadow-md hover:brightness-110 focus-visible:ring-success",
          )}
        >
          {kind === "verify" ? <Check className="size-4" strokeWidth={2.4} /> : null}
          <span className="truncate">{label}</span>
          {kind !== "verify" ? <ChevronRight className="size-4" strokeWidth={2.4} /> : null}
        </button>
      </div>
    </footer>
  );
}