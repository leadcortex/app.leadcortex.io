//frontend\routes\app\sequences\index.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge, Kpi } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import {
  Plus,
  Play,
  Pause,
  Mail,
  Send,
  Linkedin,
  Phone,
  Clock,
  Copy,
  Trash2,
  Pencil,
  Eye,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { SequencesListSkeleton } from "@/components/skeletons";
import { ActionMenu } from "@/components/action-menu";

export const Route = createFileRoute("/app/sequences/")({
  head: () => ({
    meta: [
      { title: "Séquences — LeadCortex" },
      {
        name: "description",
        content:
          "Pilotez vos séquences de prospection multicanales : étapes, cadence d'envoi, ouvertures et réponses.",
      },
      { property: "og:title", content: "Séquences — LeadCortex" },
      {
        property: "og:description",
        content: "Pilotez vos séquences de prospection multicanales.",
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
  const pct = (v: string) => Number(String(v).replace("%", "")) || 0;
  const avgOf = (key: "opens" | "replies") =>
    sequences.length
      ? `${Math.round(sequences.reduce((n, s) => n + pct(s[key]), 0) / sequences.length)}%`
      : "0%";
  const avgOpens = avgOf("opens");
  const avgReplies = avgOf("replies");

  const columns: Column<(typeof sequences)[number]>[] = [
    {
      key: "name",
      header: "Séquence",
      sortable: true,
      accessor: (row) => (
        <Link
          to={`/app/sequences/$id`}
          params={{ id: row.id }}
          className="flex items-center gap-2 md:gap-3 hover:text-primary transition-colors group"
        >
          <div
            className={`size-6 md:size-8 rounded-lg grid place-items-center ${
              row.status === "active"
                ? "bg-primary/8 text-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {row.status === "active" ? (
              <Play className="size-3 md:size-3.5" fill="currentColor" />
            ) : (
              <Pause className="size-3 md:size-3.5" />
            )}
          </div>
          <div>
            <p className="font-medium text-xs md:text-sm group-hover:underline">{row.name}</p>
            <p className="text-[9px] md:text-xs text-muted-foreground flex items-center gap-0.5 md:gap-1">
              <Mail className="size-2.5 md:size-3" /> Email + LinkedIn
            </p>
          </div>
        </Link>
      ),
      cellClassName: "min-w-[140px] md:min-w-[200px]",
    },
    {
      key: "steps",
      header: "Étapes",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.steps}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "leads",
      header: "Leads",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.leads}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "opens",
      header: "Ouvertures",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.opens}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "replies",
      header: "Réponses",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.replies}</span>,
      className: "text-center",
      cellClassName: "text-center",
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      accessor: (row) => (
        <Badge tone={row.status === "active" ? "primary" : "muted"}>
          {row.status === "active" ? "Actif" : "En pause"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSequenceStatus(row.id);
              const next = row.status === "active" ? "en pause" : "activée";
              toast.success(`Séquence ${next}`);
              addActivity("Séquence " + next, row.name);
            }}
            className="inline-flex items-center gap-0.5 md:gap-1 text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 border border-border rounded-md hover:bg-surface transition-colors"
          >
            {row.status === "active" ? (
              <>
                <Pause className="size-2.5 md:size-3" /> Pauser
              </>
            ) : (
              <>
                <Play className="size-2.5 md:size-3" /> Activer
              </>
            )}
          </button>
          <ActionMenu items={rowMenu(row)} />
        </div>
      ),
      className: "w-20 md:w-32",
    },
  ];

  // Empty state
  if (sequences.length === 0) {
    return (
      <div className="max-w-full">
        <PageHeader
          eyebrow="Séquences"
          title="Vos séquences d'envoi."
          description="Multi-étape, multi-canal, avec routage adaptatif selon les réponses."
          actions={
            <Link
              to="/app/sequences/new"
              className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
            >
              <Plus className="size-3 md:size-3.5" /> Nouvelle séquence
            </Link>
          }
        />

        <div className="relative isolate overflow-hidden rounded-2xl">
          <img
            src="/images/sequences.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
          />
          <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
            <EmptyState
              icon={Send}
              title="Aucune séquence"
              description="Créez votre première séquence pour automatiser vos campagnes de prospection."
              action={{
                label: "Créer une séquence",
                onClick: () => navigate({ to: "/app/sequences/new" }),
                icon: Plus,
              }}
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Séquences"
        title="Vos séquences d'envoi."
        description="Multi-étape, multi-canal, avec routage adaptatif selon les réponses."
        actions={
          <Link
            to="/app/sequences/new"
            className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
          >
            <Plus className="size-3 md:size-3.5" /> Nouvelle séquence
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <Kpi
          label="Séquences actives"
          value={String(active.length)}
          sub={`${sequences.length - active.length} en pause`}
        />
        <Kpi
          label="Leads en séquence"
          value={String(totalLeads)}
          sub={`${sequences.length} séquences`}
        />
        <Kpi label="Taux d'ouverture" value={avgOpens} delta="+4%" up />
        <Kpi label="Taux de réponse" value={avgReplies} delta="+2%" up />
      </div>

      {detailed.length > 0 && (
        <section className="mb-4 md:mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Séquences créées ({detailed.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {detailed.map((seq) => {
              const duration = (seq.stepsDetail ?? []).reduce(
                (max, s) => Math.max(max, s.delay),
                0,
              );
              return (
                <article
                  key={seq.id}
                  className="rounded-xl border border-border bg-background p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/app/sequences/$id"
                        params={{ id: seq.id }}
                        className="font-medium text-sm hover:underline"
                      >
                        {seq.name}
                      </Link>
                      {seq.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {seq.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge tone={seq.status === "active" ? "primary" : "muted"}>
                        {seq.status === "active"
                          ? "Actif"
                          : seq.status === "paused"
                            ? "En pause"
                            : "Brouillon"}
                      </Badge>
                      <ActionMenu items={rowMenu(seq)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {seq.steps} étapes · {duration} j
                    </span>
                    {seq.audience && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                        <Users className="size-3" /> {seq.audience}
                      </span>
                    )}
                    {seq.settings && (
                      <span>
                        {seq.settings.dailyLimit}/jour · {seq.settings.sendWindowStart}–
                        {seq.settings.sendWindowEnd}
                      </span>
                    )}
                  </div>

                  <ol className="space-y-1.5">
                    {(seq.stepsDetail ?? []).slice(0, 4).map((s, i) => {
                      const Icon = CHANNEL_ICON[s.type];
                      return (
                        <li
                          key={s.id}
                          className="flex items-start gap-2 text-xs rounded-lg border border-border/70 bg-surface/40 px-2.5 py-1.5"
                        >
                          <Icon className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            J{s.delay > 0 ? `+${s.delay}` : ""}
                          </span>
                          <span className="truncate">
                            {s.subject?.trim() || s.content || `Étape ${i + 1}`}
                          </span>
                        </li>
                      );
                    })}
                    {(seq.stepsDetail?.length ?? 0) > 4 && (
                      <li className="text-[11px] text-muted-foreground pl-1">
                        +{(seq.stepsDetail?.length ?? 0) - 4} autres étapes
                      </li>
                    )}
                  </ol>

                  {seq.tags && seq.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {seq.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10px] rounded-full border border-border text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        toggleSequenceStatus(seq.id);
                        toast.success(
                          seq.status === "active" ? "Séquence en pause" : "Séquence activée",
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 border border-border rounded-md hover:bg-surface transition-colors"
                    >
                      {seq.status === "active" ? (
                        <>
                          <Pause className="size-3" /> Pauser
                        </>
                      ) : (
                        <>
                          <Play className="size-3" /> Activer
                        </>
                      )}
                    </button>
                    <Link
                      to="/app/sequences/$id"
                      params={{ id: seq.id }}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-foreground text-background hover:opacity-90 transition-all"
                    >
                      <Eye className="size-3" /> Ouvrir
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <DataTable
        data={sequences}
        columns={columns}
        keyExtractor={(row) => row.id}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Nom de la séquence..."
        searchFields={["name"]}
        emptyMessage="Aucune séquence créée."
      />

      <section className="mt-4 md:mt-8 rounded-xl border border-border bg-surface/40 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
          <div>
            <h2 className="font-display text-xl md:text-2xl italic">Composer une accroche.</h2>
            <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-muted-foreground">
              Décrivez le contexte, l'agent rédige. Vous éditez, vous envoyez.
            </p>
          </div>
          <button
            onClick={() => toast.success("Cortex rédige une accroche...")}
            className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs bg-primary text-primary-foreground rounded-md hover:brightness-110 transition-all shrink-0"
          >
            Générer avec Cortex
          </button>
        </div>
      </section>
    </div>
  );
}
