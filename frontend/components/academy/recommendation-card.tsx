//frontend\components\academy\recommendation-card.tsx
"use client";

/**
 * Recommendation Card — action prioritaire suggérée par l'adaptivité.
 *
 * Consommée par /app/academy/index et par le profil. Affiche le libellé,
 * le motif, la durée estimée, et un CTA qui navigue vers la leçon ciblée.
 */
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Coffee,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Recommendation, RecommendationKind } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

const META: Record<
  RecommendationKind,
  { icon: LucideIcon; label: string; tone: string }
> = {
  review_concept: {
    icon: RotateCcw,
    label: "Révision SRS",
    tone: "text-amber-600 bg-amber-500/10",
  },
  practice_concept: {
    icon: Sparkles,
    label: "Pratique ciblée",
    tone: "text-primary bg-primary/10",
  },
  resume_lesson: {
    icon: Play,
    label: "Reprendre",
    tone: "text-primary bg-primary/10",
  },
  start_lesson: {
    icon: BookOpen,
    label: "Nouvelle leçon",
    tone: "text-primary bg-primary/10",
  },
  rest_day: {
    icon: Coffee,
    label: "Repos",
    tone: "text-muted-foreground bg-secondary",
  },
  none: {
    icon: Sparkles,
    label: "Libre",
    tone: "text-muted-foreground bg-secondary",
  },
};

export type RecommendationCardProps = {
  recommendation: Recommendation;
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const meta = META[recommendation.kind] ?? META.none;
  const Icon = meta.icon;

  const targetLessonId = recommendation.lesson_id;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-primary/[0.01] p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl",
            meta.tone,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            Suggéré pour vous · {meta.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground md:text-[15px]">
            {recommendation.reason}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            ≈ {recommendation.estimated_minutes} min
          </p>
        </div>

        {targetLessonId ? (
          <Link
            to="/app/academy/lesson/$lessonId"
            params={{ lessonId: targetLessonId }}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 self-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground",
              "shadow-md transition-opacity hover:opacity-90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            Commencer
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}