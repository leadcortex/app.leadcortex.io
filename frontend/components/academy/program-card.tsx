//frontend\components\academy\program-card.tsx
"use client";

/**
 * Program Card — carte d'un programme dans la grille Academy.
 *
 * Affiche : icône, titre, sous-titre, difficulté, progression.
 * Cliquable : navigue vers /app/academy/{programId}.
 */
import { Link } from "@tanstack/react-router";
import { BookOpen, Send, Search, Trophy, Building2, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ProgramDTO } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

/** Résolution simple des icônes du catalogue YAML. */
const ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  send: Send,
  search: Search,
  trophy: Trophy,
  "building-2": Building2,
};

export type ProgramCardProps = {
  program: ProgramDTO;
  progress?: { completed: number; total: number };
  index: number;
};

export function ProgramCard({ program, progress, index }: ProgramCardProps) {
  const Icon = ICONS[program.icon] ?? Layers;
  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? program.total_lessons;
  const ratio = total > 0 ? completed / total : 0;
  const pct = Math.round(ratio * 100);
  const isFinished = total > 0 && completed === total;
  const isStarted = completed > 0 && !isFinished;

  const accent = program.color || "var(--primary)";

  return (
    <Link
      to="/app/academy/$programId"
      params={{ programId: program.id }}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all",
        "hover:border-primary/40 hover:shadow-[var(--shadow-card)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      {/* Bandeau coloré supérieur */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />

      {/* Icône + difficulté */}
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
        <span className="rounded-full bg-surface/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
          Niveau {program.difficulty}/5
        </span>
      </div>

      {/* Titre + sous-titre */}
      <div className="min-w-0">
        <h3 className="font-display text-xl italic leading-tight">
          {program.title}
        </h3>
        {program.subtitle ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {program.subtitle}
          </p>
        ) : null}
      </div>

      {/* Métadonnées */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Layers className="size-3" />
          {program.total_lessons} leçon{program.total_lessons > 1 ? "s" : ""}
        </span>
        {program.estimated_minutes > 0 ? (
          <span className="font-mono">≈ {program.estimated_minutes} min</span>
        ) : null}
      </div>

      {/* Progression */}
      <div className="mt-auto space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium uppercase tracking-wider text-muted-foreground">
            {isFinished ? "Terminé" : isStarted ? "En cours" : "Non commencé"}
          </span>
          <span className="font-mono tabular-nums text-muted-foreground">
            {completed} / {total}
          </span>
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isFinished ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}