// frontend/routes/app/hub/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bookmark,
  CalendarDays,
  CheckSquare,
  LayoutGrid,
  ListChecks,
  Phone,
  Sparkles,
  Users,
} from "@/components/icons";

import { PageHeader } from "@/components/common/ui-primitives";
import { TableViewSkeleton } from "@/components/skeletons";
import { TasksView } from "@/components/hub/tasks-view";
import { ListsView } from "@/components/hub/lists-view";
import { CallsView } from "@/components/hub/calls-view";
import { SavedView } from "@/components/hub/saved-view";
import { MeetingsView } from "@/components/hub/meetings-view";
import { StatTile } from "@/components/ui/stat-tile";
import { useAppStore } from "@/lib/state/store";

export const Route = createFileRoute("/app/hub/")({
  head: () => ({ meta: [{ title: "Hub — LeadCortex" }] }),
  pendingComponent: () => (
    <TableViewSkeleton
      label="Chargement du Hub"
      kpis={5}
      kpiVariant="stat"
      rows={8}
      columns={4}
      filters={2}
      comfortable
    />
  ),
  component: HubPage,
});

function HubPage() {
  const { leads, companies, tasks, lists, calls, meetings } = useAppStore();

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);
  const savedLeads = useMemo(() => leads.filter((l) => l.saved).length, [leads]);
  const savedCompanies = useMemo(() => companies.filter((c) => c.saved).length, [companies]);
  const bookedCalls = useMemo(
    () => calls.filter((c) => c.outcome === "meeting-booked").length,
    [calls],
  );
  const totalContactsInLists = useMemo(
    () => lists.reduce((n, l) => n + l.count, 0),
    [lists],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 md:space-y-6 pb-10">
      <PageHeader
        eyebrow="Hub"
        title="Tout ce qui reste à faire."
        description="Tâches, listes, appels, favoris et rendez-vous — regroupés en un seul endroit."
        actions={
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            <span className="hidden sm:inline">Vue consolidée</span>
            <span className="font-mono">
              {pendingTasks + lists.length + calls.length + savedLeads + savedCompanies} éléments
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
        <StatTile
          label="Tâches"
          value={String(pendingTasks)}
          sub={`${tasks.length} au total`}
          icon={CheckSquare}
          delay={0}
        />
        <StatTile
          label="Listes"
          value={String(lists.length)}
          sub={`${totalContactsInLists} contacts`}
          icon={ListChecks}
          delay={40}
        />
        <StatTile
          label="Appels"
          value={String(calls.length)}
          sub={`${bookedCalls} RDV bookés`}
          icon={Phone}
          delay={80}
        />
        <StatTile
          label="Sauvegardés"
          value={String(savedLeads + savedCompanies)}
          sub={`${savedLeads} prospects · ${savedCompanies} entreprises`}
          icon={Bookmark}
          delay={120}
        />
        <StatTile
          label="Meetings"
          value={String(meetings.length)}
          sub="à venir"
          icon={LayoutGrid}
          delay={160}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        <section className="section-atelier p-3 md:p-4 lg:col-span-8">
          <div className="section-atelier__head">
            <div className="flex items-center gap-2 min-w-0">
              <CheckSquare className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="section-atelier__title truncate text-base md:text-lg">Tâches</h2>
            </div>
            <span className="counter-pill shrink-0">{pendingTasks}</span>
          </div>
          <TasksView />
        </section>

        <section className="section-atelier p-3 md:p-4 lg:col-span-4">
          <div className="section-atelier__head">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="section-atelier__title truncate text-base md:text-lg">Meetings</h2>
            </div>
            <span className="counter-pill shrink-0">{meetings.length}</span>
          </div>
          <MeetingsView />
        </section>

        <section className="section-atelier p-3 md:p-4 lg:col-span-12">
          <div className="section-atelier__head">
            <div className="flex items-center gap-2 min-w-0">
              <Bookmark className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="section-atelier__title truncate text-base md:text-lg">Sauvegardés</h2>
            </div>
            <span className="counter-pill shrink-0">{savedLeads + savedCompanies}</span>
          </div>
          <SavedView />
        </section>

        <section className="section-atelier p-3 md:p-4 lg:col-span-6">
          <div className="section-atelier__head">
            <div className="flex items-center gap-2 min-w-0">
              <ListChecks className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="section-atelier__title truncate text-base md:text-lg">Listes</h2>
            </div>
            <span className="counter-pill shrink-0">{lists.length}</span>
          </div>
          <ListsView />
        </section>

        <section className="section-atelier p-3 md:p-4 lg:col-span-6">
          <div className="section-atelier__head">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="section-atelier__title truncate text-base md:text-lg">Appels</h2>
            </div>
            <span className="counter-pill shrink-0">{calls.length}</span>
          </div>
          <CallsView />
        </section>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/30 px-4 py-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="size-3.5" />
          <span>Toutes les données sont synchronisées avec les pages individuelles.</span>
        </div>
      </section>
    </div>
  );
}
