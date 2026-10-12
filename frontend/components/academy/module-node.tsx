//frontend\components\academy\module-node.tsx
"use client";

/**
 * Module Node — un module dépliable avec sa liste de leçons.
 *
 * Le statut visuel de chaque leçon utilise le SVG LessonNode
 * (locked / available / in_progress / completed / mastered).
 */
import { useMemo, useState } from "react";
import { ChevronDown, Lock, Play, Check } from "lucide-react";

import { LessonNode, type LessonNodeState } from "./svg/lesson-node";
import type { LessonProgressView, ModuleDTO } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export type ModuleNodeProps = {
  module: ModuleDTO;
  completedCount: number;
  lessonStatus: Map<string, LessonProgressView>;
  onLessonClick: (lessonId: string) => void;
};

/** Mappe un statut backend vers un état visuel du LessonNode. */
function toNodeState(status: string | undefined): LessonNodeState {
  switch (status) {
    case "completed":
      return "completed";
    case "mastered":
      return "mastered";
    case "in_progress":
      return "in_progress";
    case "locked":
      return "locked";
    case "available":
    default:
      return "available";
  }
}

export function ModuleNode({
  module,
  completedCount,
  lessonStatus,
  onLessonClick,
}: ModuleNodeProps) {
  const [open, setOpen] = useState(true);

  const lessons = useMemo(
    () => [...(module.lessons ?? [])].sort((a, b) => a.order - b.order),
    [module.lessons],
  );

  const total = lessons.length;
  const allDone = total > 0 && completedCount === total;
  const anyDone = completedCount > 0 && !allDone;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      {/* En-tête de module */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/40 md:px-5 md:py-4",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold",
            allDone
              ? "bg-success/12 text-success"
              : anyDone
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground",
          )}
        >
          {allDone ? <Check className="size-4" strokeWidth={2.6} /> : module.order}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold md:text-base">
            {module.title}
          </h3>
          {module.description ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground md:text-xs">
              {module.description}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {completedCount} / {total}
        </span>

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Liste des leçons */}
      {open ? (
        <ul className="divide-y divide-border border-t border-border">
          {lessons.map((lesson) => {
            const status = lessonStatus.get(lesson.id);
            const state = toNodeState(status?.status);
            const progressRatio =
              state === "in_progress" && status?.progress_ratio !== undefined
                ? status.progress_ratio
                : 0;
            const clickable = state !== "locked";

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onLessonClick(lesson.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors md:px-5",
                    clickable
                      ? "hover:bg-surface/40 focus-visible:outline-none focus-visible:bg-surface/40"
                      : "cursor-not-allowed opacity-70",
                  )}
                >
                  <span className="shrink-0">
                    <LessonNode size={40} state={state} progress={progressRatio} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lesson.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                      {lesson.duration_min > 0 ? (
                        <span className="font-mono">≈ {lesson.duration_min} min</span>
                      ) : null}
                      <span className="font-mono">{lesson.xp_total} XP</span>
                    </div>
                  </div>

                  <span className="shrink-0">
                    {state === "locked" ? (
                      <Lock className="size-4 text-muted-foreground" />
                    ) : state === "completed" || state === "mastered" ? (
                      <Check className="size-4 text-success" strokeWidth={2.6} />
                    ) : (
                      <Play className="size-4 text-primary" strokeWidth={2.2} />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}