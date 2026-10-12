//frontend\routes\app.academy.$programId.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { PageHeader, Badge } from "@/components/ui-primitives";
import { ProgramTree } from "@/components/academy/program-tree";
import {
  useAcademySnapshot,
  useProgram,
} from "@/lib/academy/hooks";
import type { LessonProgressView, Snapshot } from "@/lib/academy/types";

export const Route = createFileRoute("/app/academy/$programId")({
  head: ({ params }) => ({
    meta: [
      { title: `Programme ${params.programId} — Academy` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgramDetailPage,
});

/* ─── Helpers ────────────────────────────────────────────────────────── */

function buildLessonStatusMap(
  snapshot: Snapshot | undefined,
): Map<string, LessonProgressView> {
  const map = new Map<string, LessonProgressView>();
  if (!snapshot?.programs) return map;
  for (const p of snapshot.programs) {
    for (const m of p.modules ?? []) {
      for (const l of m.lessons ?? []) {
        map.set(l.lesson_id, l);
      }
    }
  }
  return map;
}

/* ─── Page ───────────────────────────────────────────────────────────── */

function ProgramDetailPage() {
  const { programId } = Route.useParams();
  const navigate = useNavigate();
  const programQuery = useProgram(programId);
  const snapshotQuery = useAcademySnapshot();

  const lessonStatus = useMemo(
    () => buildLessonStatusMap(snapshotQuery.data),
    [snapshotQuery.data],
  );

  if (programQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (programQuery.isError || !programQuery.data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl italic">Programme introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce programme n'existe pas ou a été retiré.
        </p>
        <Link
          to="/app/academy"
          className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Retour aux programmes
        </Link>
      </div>
    );
  }

  const program = programQuery.data;
  const totalLessons = program.total_lessons;
  const completed = program.modules
    ? program.modules.reduce((acc, m) => {
        return (
          acc +
          (m.lessons ?? []).filter(
            (l) => lessonStatus.get(l.id)?.status === "completed",
          ).length
        );
      }, 0)
    : 0;

  const handleLessonClick = (lessonId: string) => {
    navigate({ to: "/app/academy/lesson/$lessonId", params: { lessonId } });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      <Link
        to="/app/academy"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Tous les programmes
      </Link>

      <PageHeader
        eyebrow={`Programme · ${program.difficulty}/5`}
        title={program.title}
        description={program.description}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="muted">{program.total_lessons} leçons</Badge>
        <Badge tone="muted">≈ {program.estimated_minutes} min</Badge>
        <Badge tone={completed > 0 ? "primary" : "muted"}>
          {completed} / {totalLessons} terminées
        </Badge>
      </div>

      {program.modules && program.modules.length > 0 ? (
        <ProgramTree
          modules={program.modules}
          lessonStatus={lessonStatus}
          onLessonClick={handleLessonClick}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-8 text-center text-sm text-muted-foreground">
          Ce programme ne contient pas encore de modules.
        </div>
      )}
    </div>
  );
}