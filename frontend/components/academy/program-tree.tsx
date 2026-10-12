//frontend\components\academy\program-tree.tsx
"use client";

/**
 * Program Tree — liste des modules d'un programme.
 *
 * Chaque module est un ModuleNode collapsible qui montre ses leçons.
 * Le statut de chaque leçon est dérivé du snapshot (fallback : "available").
 */
import type { LessonProgressView, ModuleDTO } from "@/lib/academy/types";

import { ModuleNode } from "./module-node";

export type ProgramTreeProps = {
  modules: ModuleDTO[];
  lessonStatus: Map<string, LessonProgressView>;
  onLessonClick: (lessonId: string) => void;
};

export function ProgramTree({
  modules,
  lessonStatus,
  onLessonClick,
}: ProgramTreeProps) {
  const ordered = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      {ordered.map((m) => {
        const completed = (m.lessons ?? []).filter(
          (l) => lessonStatus.get(l.id)?.status === "completed",
        ).length;
        return (
          <ModuleNode
            key={m.id}
            module={m}
            completedCount={completed}
            lessonStatus={lessonStatus}
            onLessonClick={onLessonClick}
          />
        );
      })}
    </div>
  );
}