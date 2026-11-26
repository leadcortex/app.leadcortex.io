// frontend/routes/app/sequences/index.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import DataTable, { type Column } from "@/components/common/data-table";
import {
  Plus,
  Play,
  Pause,
  Mail,
  Send,
  Linkedin,
  Phone,
  Copy,
  Trash2,
  Pencil,
  Eye,
} from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { SequencesListSkeleton } from "@/components/skeletons";
import { ActionMenu } from "@/components/common/action-menu";

export const Route = createFileRoute("/app/sequences/")({
  head: () => ({
    meta: [
      { title: "Séquences · LeadCortex" },
      {
        name: "description",
        content: "Vos séquences de prospection : étapes, rythme d’envoi, ouvertures et réponses.",
      },
      { property: "og:title", content: "Séquences · LeadCortex" },
      {
        property: "og:description",
        content: "Vos séquences de prospection par email, LinkedIn et téléphone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => <SequencesListSkeleton />,
  component: SequencesPage,
});

const CHANNEL_ICON = { email: Mail, linkedin: Linkedin, call: Phone } as const;

function SequencesPage() {
  const navigate = useNavigate();

  const {
    sequences,
    toggleSequenceStatus,
    addActivity,
    duplicateSequence,
    deleteSequence,
    updateSequence,
  } = useAppStore();

  const rowMenu = (row: (typeof sequences)[number]) => [
    {
      label: "Voir le détail",
      icon: Eye,
      onSelect: () => navigate({ to: "/app/sequences/$id", params: { id: row.id } }),
    },
    {
      label: "Renommer",
      icon: Pencil,
      onSelect: () => {
        const next = prompt("Nouveau nom de la séquence", row.name);
        if (next && next.trim() && next.trim() !== row.name) {
          updateSequence(row.id, { name: next.trim() });
          addActivity("Séquence renommée", next.trim());
          toast.success("Séquence renommée");
        }
      },
    },
    {
      label: "Dupliquer",
      icon: Copy,
      onSelect: () => {
        duplicateSequence(row.id);
        toast.success(`"${row.name}" dupliquée`);
      },
    },
    {
      label: "Supprimer",
      icon: Trash2,
      tone: "danger" as const,
      separatorBefore: true,
      onSelect: () => {
        if (!confirm(`Supprimer la séquence "${row.name}" ?`)) return;
        deleteSequence(row.id);
        addActivity("Séquence supprimée", row.name);
        toast.success("Séquence supprimée");
      },
    },
  ];

  const active = sequences.filter((s) => s.status === "active");
  const totalLeads = sequences.reduce((n, s) => n + s.leads, 0);
  const detailed = sequences.filter((s) => (s.stepsDetail?.length ?? 0) > 0);

  const toggleStatus = (row: (typeof sequences)[number]) => {
    toggleSequenceStatus(row.id);
    const next = row.status === "active" ? "en pause" : "activée";
    toast.success(`Séquence ${next}`);
    addActivity("Séquence " + next, row.name);
  };

  const newButton = (
    <Button asChild>
      <Link to="/app/sequences/new">
        <Plus /> Nouvelle séquence
      </Link>
    </Button>
  );

  const columns: Column<(typeof sequences)[number]>[] = [
    {
      key: "name",
      header: "Séquence",
      sortable: true,
      accessor: (row) => (
        <Link
          to={`/app/sequences/$id`}
          params={{ id: row.id }}
          className="block min-w-0 transition-colors hover:text-primary"
        >
          <p className="truncate text-sm font-medium">{row.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Email et LinkedIn</p>
        </Link>
      ),
      cellClassName: "min-w-[160px] md:min-w-[220px]",
    },
    {
      key: "steps",
      header: "Étapes",
      sortable: true,
      accessor: (row) => <span className="text-sm tabular-nums">{row.steps}</span>,
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "leads",
      header: "Leads",
      sortable: true,
      accessor: (row) => <span className="text-sm tabular-nums">{row.leads}</span>,
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "opens",
      header: "Ouvertures",
      sortable: true,
      accessor: (row) => <span className="text-sm tabular-nums">{row.opens}</span>,
      className: "text-right",
      cellClassName: "text-right",
      hideOnMobile: true,
    },
    {
      key: "replies",
      header: "Réponses",
      sortable: true,
      accessor: (row) => <span className="text-sm tabular-nums">{row.replies}</span>,
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      accessor: (row) => (
        <Badge tone={row.status === "active" ? "primary" : "muted"}>
          {row.status === "active" ? "Active" : row.status === "paused" ? "En pause" : "Brouillon"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(row);
            }}
          >
            {row.status === "active" ? (
              <>
                <Pause /> <span className="hidden md:inline">Mettre en pause</span>
              </>
            ) : (
              <>
                <Play /> <span className="hidden md:inline">Activer</span>
              </>
            )}
          </Button>
          <ActionMenu items={rowMenu(row)} />
        </div>
      ),
      className: "w-24 md:w-48",
    },
  ];

  if (sequences.length === 0) {
    return (
      <div className="max-w-full">
        <PageHeader eyebrow="Engager" title="Vos séquences." actions={newButton} />
        <EmptyState
          icon={Send}
          title="Aucune séquence pour l'instant"
          action={{
            label: "Créer une séquence",
            onClick: () => navigate({ to: "/app/sequences/new" }),
            icon: Plus,
          }}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Engager"
        title="Vos séquences."
        description={`${active.length} active${active.length > 1 ? "s" : ""} sur ${sequences.length} · ${totalLeads} leads en cours`}
        actions={newButton}
      />

      <DataTable
        data={sequences}
        columns={columns}
        keyExtractor={(row) => row.id}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Rechercher une séquence"
        searchFields={["name"]}
        emptyMessage="Aucune séquence trouvée."
      />

      {detailed.length > 0 && (
        <section className="mt-12">
          <h2 className="text-base font-semibold">Étapes des séquences créées</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {detailed.map((seq) => {
              const duration = (seq.stepsDetail ?? []).reduce(
                (max, s) => Math.max(max, s.delay),
                0,
              );
              return (
                <article
                  key={seq.id}
                  className="rounded-xl border border-border bg-card p-4 md:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/app/sequences/$id"
                        params={{ id: seq.id }}
                        className="text-sm font-semibold hover:underline"
                      >
                        {seq.name}
                      </Link>
                      {seq.description && (
                        <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                          {seq.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge tone={seq.status === "active" ? "primary" : "muted"}>
                        {seq.status === "active"
                          ? "Active"
                          : seq.status === "paused"
                            ? "En pause"
                            : "Brouillon"}
                      </Badge>
                      <ActionMenu items={rowMenu(seq)} />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {seq.steps} étapes sur {duration} jours
                    {seq.audience && <> · {seq.audience}</>}
                    {seq.settings && (
                      <>
                        {" "}
                        · {seq.settings.dailyLimit} par jour, de {seq.settings.sendWindowStart} à{" "}
                        {seq.settings.sendWindowEnd}
                      </>
                    )}
                  </p>

                  <ol className="mt-4 divide-y divide-border border-y border-border">
                    {(seq.stepsDetail ?? []).slice(0, 4).map((s, i) => {
                      const Icon = CHANNEL_ICON[s.type];
                      return (
                        <li key={s.id} className="flex items-center gap-3 py-2 text-[13px]">
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                            J{s.delay > 0 ? `+${s.delay}` : ""}
                          </span>
                          <span className="truncate">
                            {s.subject?.trim() || s.content || `Étape ${i + 1}`}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  {(seq.stepsDetail?.length ?? 0) > 4 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Et {(seq.stepsDetail?.length ?? 0) - 4} autres étapes
                    </p>
                  )}

                  {seq.tags && seq.tags.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">{seq.tags.join(", ")}</p>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(seq)}>
                      {seq.status === "active" ? (
                        <>
                          <Pause /> Mettre en pause
                        </>
                      ) : (
                        <>
                          <Play /> Activer
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/app/sequences/$id" params={{ id: seq.id }}>
                        Ouvrir
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold">Besoin d'une accroche ?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Décrivez le contexte, Cortex propose un premier jet que vous retouchez.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.success("Cortex rédige une accroche...")}
          className="shrink-0"
        >
          Rédiger avec Cortex
        </Button>
      </section>
    </div>
  );
}
