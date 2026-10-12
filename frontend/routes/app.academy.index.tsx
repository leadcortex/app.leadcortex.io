//frontend\routes\app.academy.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/ui-primitives";
import { EmptyState } from "@/components/empty-state";
import { ProgramCard } from "@/components/academy/program-card";
import { RecommendationCard } from "@/components/academy/recommendation-card";
import {
  useAcademySnapshot,
  usePrograms,
  useRecommendation,
} from "@/lib/academy/hooks";
import type { ProgramDTO, Snapshot } from "@/lib/academy/types";

export const Route = createFileRoute("/app/academy/")({
  head: () => ({
    meta: [
      { title: "Academy — LeadCortex" },
      { description: "Vos programmes, votre progression." },
    ],
  }),
  component: AcademyIndexPage,
});

/* ─── Helpers ────────────────────────────────────────────────────────── */

function snapshotProgramMap(snapshot: Snapshot | undefined) {
  const map = new Map<
    string,
    { completed: number; total: number; title: string }
  >();
  if (!snapshot?.programs) return map;
  for (const p of snapshot.programs) {
    map.set(p.program_id, {
      completed: p.completed_lessons,
      total: p.total_lessons,
      title: p.title,
    });
  }
  return map;
}

/* ─── Page ───────────────────────────────────────────────────────────── */

function AcademyIndexPage() {
  const programsQuery = usePrograms();
  const snapshotQuery = useAcademySnapshot();
  const recQuery = useRecommendation();

  const progressMap = useMemo(
    () => snapshotProgramMap(snapshotQuery.data),
    [snapshotQuery.data],
  );

  const programs = programsQuery.data?.programs ?? [];

  const totalLessons = programs.reduce((n, p) => n + p.total_lessons, 0);
  const totalCompleted = Array.from(progressMap.values()).reduce(
    (n, p) => n + p.completed,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <PageHeader
        eyebrow="Academy"
        title="Votre parcours."
        description={
          totalLessons > 0
            ? `${totalCompleted} leçons terminées sur ${totalLessons}`
            : "Découvrez les programmes"
        }
      />

      {recQuery.data && recQuery.data.kind !== "none" ? (
        <RecommendationCard recommendation={recQuery.data} />
      ) : null}

      {programsQuery.isLoading ? (
        <ProgramsSkeleton />
      ) : programs.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aucun programme disponible"
          description="Le contenu pédagogique n'a pas encore été chargé par le serveur."
          size="lg"
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => (
            <ProgramCard
              key={p.id}
              program={p}
              progress={progressMap.get(p.id)}
              index={i}
            />
          ))}
        </section>
      )}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */

function ProgramsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="skeleton h-56 rounded-2xl border border-border"
        />
      ))}
    </div>
  );
}