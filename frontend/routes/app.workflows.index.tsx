//frontend\routes\app.workflows.index.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Play, Pause, Copy, Trash2, Workflow, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import type { Workflow as WorkflowRecord } from "@/lib/mock-data";
import { PageHeader, Badge } from "@/components/ui-primitives";
import { WorkflowsSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/workflows/")({
  head: () => ({
    meta: [
      { title: "Workflows — LeadCortex" },
      {
        name: "description",
        content: "Toutes vos automatisations de prospection B2B : séquences, scoring et routage.",
      },
      { property: "og:title", content: "Workflows — LeadCortex" },
      { property: "og:description", content: "Pilotez vos séquences de prospection automatisées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => <WorkflowsSkeleton />,
  component: WrappedWorkflowsPage,
});

function WrappedWorkflowsPage() {
  return <WorkflowsPage />;
}

const templates = [
  { name: "Lead scoré → séquence", desc: "Enrôler dès que le score IA dépasse un seuil." },
  { name: "Réponse positive → opportunité", desc: "Créer une opp au premier signal d'achat." },
  { name: "Signal détecté → Slack", desc: "Alerter l'équipe sur un signal d'intention fort." },
];

const statusTone: Record<
  WorkflowRecord["status"],
  { label: string; tone: "success" | "warning" | "muted" }
> = {
  active: { label: "Actif", tone: "success" as const },
  paused: { label: "En pause", tone: "warning" as const },
  draft: { label: "Brouillon", tone: "muted" as const },
};

function WorkflowCard({ wf }: { wf: WorkflowRecord }) {
  const { toggleWorkflowStatus, duplicateWorkflow, deleteWorkflow } = useAppStore();
  const status = statusTone[wf.status];

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-panel)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/app/workflows/$workflowId"
            params={{ workflowId: wf.id }}
            className="block truncate text-sm font-medium text-foreground hover:text-primary"
          >
            {wf.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {wf.trigger}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {[
          ["Actions", wf.actions],
          ["Exécutions", wf.runs],
          ["Statut", status.label],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </dt>
            <dd className="font-mono text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => toggleWorkflowStatus(wf.id)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {wf.status === "active" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {wf.status === "active" ? "Mettre en pause" : "Activer"}
        </button>
        <button
          type="button"
          onClick={() => {
            duplicateWorkflow(wf.id);
            toast.success("Workflow dupliqué");
          }}
          title="Dupliquer"
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Copy className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            deleteWorkflow(wf.id);
            toast.success("Workflow supprimé");
          }}
          title="Supprimer"
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
        <Link
          to="/app/workflows/$workflowId"
          params={{ workflowId: wf.id }}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
        >
          Ouvrir <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

function WorkflowsPage() {
  const navigate = useNavigate();
  const { workflows } = useAppStore();

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Workflows"
          title="Automatisez la prospection."
          description="Déclencheurs, conditions et actions sur un canvas visuel. Sans écrire une ligne de code."
          actions={
            <button
              type="button"
              onClick={() => navigate({ to: "/app/workflows/new" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              <Plus className="size-3.5" /> Créer un workflow
            </button>
          }
        />

        {workflows.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <WorkflowCard key={wf.id} wf={wf} />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Workflow className="size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Aucun workflow</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Créez votre premier workflow pour automatiser vos actions de prospection.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/app/workflows/new" })}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground"
            >
              <Plus className="size-3.5" /> Créer un workflow
            </button>
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Templates
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => navigate({ to: "/app/workflows/new" })}
                className="rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/50 hover:shadow-[var(--shadow-panel)]"
              >
                <p className="text-xs font-medium">{t.name}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
