// frontend/routes/app/forms/index.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import DataTable, { type Column } from "@/components/common/data-table";
import { Plus, FileInput, MoreHorizontal, Code } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { CardViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/forms/")({
  head: () => ({ meta: [{ title: "Formulaires · LeadCortex" }] }),
  pendingComponent: () => <CardViewSkeleton label="Chargement des formulaires" cards={6} />,
  component: FormsPage,
});

function FormsPage() {
  const navigate = useNavigate();
  const { forms, toggleFormStatus } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const live = forms.filter((f) => f.status === "live").length;
  const total = forms.reduce((n, f) => n + f.submissions, 0);

  const columns: Column<(typeof forms)[number]>[] = [
    {
      key: "name",
      header: "Formulaire",
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <FileInput className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-[13px] font-medium">{row.name}</p>
        </div>
      ),
      cellClassName: "min-w-[140px] md:min-w-[200px]",
    },
    {
      key: "submissions",
      header: "Soumissions",
      sortable: true,
      accessor: (row) => <span className="text-[13px] tabular-nums">{row.submissions}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "conversion",
      header: "Conversion",
      sortable: true,
      accessor: (row) => <span className="text-[13px] tabular-nums">{row.conversion}</span>,
      className: "text-center",
      cellClassName: "text-center",
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      accessor: (row) => (
        <Badge tone={row.status === "live" ? "primary" : "muted"}>
          {row.status === "live" ? "En ligne" : "Brouillon"}
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
              toggleFormStatus(row.id);
              toast.success(`Formulaire ${row.status === "live" ? "mis en brouillon" : "publié"}`);
            }}
          >
            {row.status === "live" ? "Dépublier" : "Publier"}
          </Button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(
                `<script src="https://leadcortex.io/f/${row.id}.js"></script>`,
              );
              toast.success("Snippet copié");
            }}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:bg-surface/70 hover:text-foreground"
          >
            <Code className="size-3.5" /> Intégrer
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="Plus d'actions"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface/70 hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      ),
      className: "w-44 md:w-56",
    },
  ];

  if (forms.length === 0) {
    return (
      <div className="max-w-5xl">
        <PageHeader
          eyebrow="Inbound · Formulaires"
          title="Vos formulaires."
          description="Chaque envoi crée un prospect enrichi dans votre pipeline."
          actions={
            <Button onClick={() => toast.info("L'éditeur de formulaire arrive bientôt.")}>
              <Plus /> Créer un formulaire
            </Button>
          }
        />
        <EmptyState
          icon={FileInput}
          title="Aucun formulaire"
          description="Créez un formulaire pour recevoir des demandes depuis votre site."
          action={{
            label: "Créer un formulaire",
            onClick: () => toast.info("L'éditeur de formulaire arrive bientôt."),
            icon: Plus,
          }}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Inbound · Formulaires"
        title="Vos formulaires."
        description="Chaque envoi crée un prospect enrichi dans votre pipeline."
        actions={
          <Button onClick={() => toast.info("L'éditeur de formulaire arrive bientôt.")}>
            <Plus /> Créer un formulaire
          </Button>
        }
      />

      <p className="mb-6 text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{live}</span> en ligne sur{" "}
        {forms.length} ·{" "}
        <span className="font-medium text-foreground tabular-nums">{total}</span> envois au total
      </p>

      <DataTable
        data={forms}
        columns={columns}
        keyExtractor={(row) => row.id}
        selectedIds={selectedIds}
        onSelectRow={(id, selected) => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (selected) next.add(id);
            else next.delete(id);
            return next;
          });
        }}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedIds(new Set(forms.map((f) => f.id)));
          } else {
            setSelectedIds(new Set());
          }
        }}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Nom du formulaire..."
        searchFields={["name"]}
        emptyMessage="Aucun formulaire créé."
      />
    </div>
  );
}
