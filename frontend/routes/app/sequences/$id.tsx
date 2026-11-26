// frontend/routes/app/sequences/$id.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, PageHeader } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/state/store";
import {
  ArrowLeft,
  Play,
  Pause,
  Edit,
  MoreHorizontal,
  Users,
  BarChart3,
  Send,
} from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { DetailViewSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/app/sequences/$id")({
  head: () => ({
    meta: [{ title: "Séquence · LeadCortex" }],
  }),
  pendingComponent: () => <DetailViewSkeleton />,
  component: SequencesDetailPage,
});

function SequencesDetailPage() {
  const { id } = Route.useParams();
  const { sequences, toggleSequenceStatus } = useAppStore();
  const sequence = sequences.find((s) => s.id === id);

  const [activeTab, setActiveTab] = useState<"overview" | "steps" | "analytics">("overview");

  if (!sequence) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-semibold">Séquence introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">Elle a peut-être été supprimée.</p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/app/sequences">
            <ArrowLeft /> Retour aux séquences
          </Link>
        </Button>
      </div>
    );
  }

  const isActive = sequence.status === "active";

  return (
    <div className="max-w-6xl">
      <Link
        to="/app/sequences"
        className="mb-6 inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Séquences
      </Link>

      <PageHeader
        eyebrow={isActive ? "Séquence active" : "Séquence en pause"}
        title={sequence.name}
        description={`${sequence.leads} leads · ${sequence.replies} de réponses`}
        actions={
          <>
            <Button
              variant={isActive ? "outline" : "default"}
              onClick={() => {
                toggleSequenceStatus(sequence.id);
                toast.success(isActive ? "Séquence mise en pause" : "Séquence activée");
              }}
            >
              {isActive ? <Pause /> : <Play />}
              {isActive ? "Mettre en pause" : "Activer"}
            </Button>
            <Button variant="outline" size="icon" aria-label="Modifier" title="Modifier">
              <Edit />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Plus d'actions" title="Plus d'actions">
              <MoreHorizontal />
            </Button>
          </>
        }
      />

      <div className="mb-6 overflow-x-auto border-b border-border scrollbar-hide md:mb-8">
        <div className="flex min-w-max gap-6">
          {(["overview", "steps", "analytics"] as const).map((tab) => {
            const labels = { overview: "Aperçu", steps: "Étapes", analytics: "Analyses" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" && <OverviewTab sequence={sequence} />}
      {activeTab === "steps" && <StepsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

type SequenceRow = ReturnType<typeof useAppStore>["sequences"][number];

function OverviewTab({ sequence }: { sequence: SequenceRow }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Canaux", value: "Email et LinkedIn" },
    {
      label: "Statut",
      value: (
        <Badge tone={sequence.status === "active" ? "primary" : "muted"}>
          {sequence.status === "active" ? "Active" : "En pause"}
        </Badge>
      ),
    },
    { label: "Leads", value: sequence.leads },
    { label: "Étapes", value: sequence.steps },
    { label: "Taux d'ouverture", value: sequence.opens },
    { label: "Taux de réponse", value: sequence.replies },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:gap-12">
      <section>
        <h2 className="text-base font-semibold">Détails</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-medium tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="text-base font-semibold">Actions</h2>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => toast.info("Ajout de leads...")}
          >
            <Users /> Ajouter des leads
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => toast.info("Édition de la séquence...")}
          >
            <Edit /> Modifier la séquence
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => toast.info("Export en cours...")}
          >
            <Send /> Exporter les données
          </Button>
        </div>
      </section>
    </div>
  );
}

function StepsTab() {
  const steps = [
    { number: 1, label: "Email de prospection", channel: "Email", delay: "Jour 1" },
    { number: 2, label: "Relance LinkedIn", channel: "LinkedIn", delay: "Jour 3" },
    { number: 3, label: "Email de suivi", channel: "Email", delay: "Jour 5" },
    { number: 4, label: "Relance finale", channel: "Email", delay: "Jour 8" },
    { number: 5, label: "Appel de clôture", channel: "Appel", delay: "Jour 12" },
  ];

  return (
    <ol className="divide-y divide-border border-y border-border">
      {steps.map((s) => (
        <li key={s.number} className="flex items-center gap-4 py-3">
          <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
            {s.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {s.channel} · {s.delay}
            </p>
          </div>
          <Button variant="ghost" size="sm">
            Modifier
          </Button>
        </li>
      ))}
    </ol>
  );
}

function AnalyticsTab() {
  const items = [
    { label: "Email 1 envoyé", value: 42, total: 42 },
    { label: "Email 1 ouvert", value: 28, total: 42 },
    { label: "Relance LinkedIn", value: 18, total: 42 },
    { label: "Email 2 envoyé", value: 12, total: 42 },
  ];
  return (
    <section className="max-w-2xl">
      <h2 className="text-base font-semibold">Leads par étape</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-[13px] text-muted-foreground md:w-40">
              {item.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(item.value / item.total) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[13px] tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
      <Button
        variant="link"
        className="mt-6 px-0"
        onClick={() => toast.info("Rapport détaillé en cours...")}
      >
        <BarChart3 /> Voir le rapport complet
      </Button>
    </section>
  );
}
