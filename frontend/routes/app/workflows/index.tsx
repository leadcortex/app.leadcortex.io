// frontend/routes/app/workflows/index.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Play, Pause, Copy, Trash2, Workflow } from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import type { Workflow as WorkflowRecord } from "@/lib/data/mock-data";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { WorkflowsSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/workflows/")({
  head: () => ({
    meta: [
      { title: "Workflows · LeadCortex" },
      {
        name: "description",
        content: "Vos automatisations de prospection : séquences, scoring et routage.",
      },
      { property: "og:title", content: "Workflows · LeadCortex" },
      { property: "og:description", content: "Vos automatisations de prospection." },
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
  { name: "Lead scoré → séquence", desc: "Inscrit le lead dès que son score dépasse un seuil." },
  {
    name: "Réponse positive → opportunité",
    desc: "Crée une opportunité au premier signal d'achat.",
  },
  { name: "Signal détecté → Slack", desc: "Prévient l'équipe quand un signal d'intention arrive." },
];

const statusTone: Record<
  WorkflowRecord["status"],
  { label: string; tone: "success" | "warning" | "muted" }
> = {
  active: { label: "Actif", tone: "success" as const },
  paused: { label: "En pause", tone: "warning" as const },
  draft: { label: "Brouillon", tone: "muted" as const },
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

function WorkflowRow({ wf }: { wf: WorkflowRecord }) {
  const { toggleWorkflowStatus, duplicateWorkflow, deleteWorkflow } = useAppStore();
  const status = statusTone[wf.status];

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            to="/app/workflows/$workflowId"
            params={{ workflowId: wf.id }}
            className="min-w-0 truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {wf.name}
          </Link>
          <Badge tone={status.tone} className="shrink-0">
            {status.label}
          </Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground tabular-nums">
          <span>Déclencheur : {wf.trigger}</span>
          <span aria-hidden> · </span>
          <span>{plural(wf.actions, "action", "actions")}</span>
          <span aria-hidden> · </span>
          <span>{plural(wf.runs, "exécution", "exécutions")}</span>
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => toggleWorkflowStatus(wf.id)}>
          {wf.status === "active" ? <Pause /> : <Play />}
          {wf.status === "active" ? "Mettre en pause" : "Activer"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          aria-label="Dupliquer"
          title="Dupliquer"
          onClick={() => {
            duplicateWorkflow(wf.id);
            toast.success("Workflow dupliqué");
          }}
        >
          <Copy />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Supprimer"
          title="Supprimer"
          onClick={() => {
            deleteWorkflow(wf.id);
            toast.success("Workflow supprimé");
          }}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

function WorkflowsPage() {
  const navigate = useNavigate();
  const { workflows } = useAppStore();
  const active = workflows.filter((w) => w.status === "active").length;
  const create = () => navigate({ to: "/app/workflows/new" });

  return (
    <div className="mx-auto w-full max-w-5xl pb-10">
      <PageHeader
        eyebrow="Workflows"
        title="Vos automatisations"
        description={
          workflows.length
            ? `${plural(workflows.length, "workflow", "workflows")} · ${plural(active, "actif", "actifs")}`
            : undefined
        }
        actions={
          <Button onClick={create}>
            <Plus /> Créer un workflow
          </Button>
        }
      />

      {workflows.length ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {workflows.map((wf) => (
            <WorkflowRow key={wf.id} wf={wf} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Workflow}
          title="Aucun workflow pour l'instant"
          action={{ label: "Créer un workflow", onClick: create, icon: Plus }}
        />
      )}

      <section className="mt-8 md:mt-12">
        <h2 className="text-base font-semibold">Partir d'un modèle</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={create}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-surface/70"
            >
              <p className="text-[13px] font-medium">{t.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
