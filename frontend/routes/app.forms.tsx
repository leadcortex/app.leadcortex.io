//frontend\routes\app.forms.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge, Kpi } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { Plus, FileInput, MoreHorizontal, Code } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { CardViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/forms")({
  head: () => ({ meta: [{ title: "Formulaires — LeadCortex" }] }),
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
        <div className="flex items-center gap-2 md:gap-3">
          <div className="size-8 md:size-10 rounded-lg bg-primary/8 text-primary grid place-items-center shrink-0">
            <FileInput className="size-3.5 md:size-4" strokeWidth={1.75} />
          </div>
          <p className="font-medium text-xs md:text-sm">{row.name}</p>
        </div>
      ),
      cellClassName: "min-w-[140px] md:min-w-[200px]",
    },
    {
      key: "submissions",
      header: "Soumissions",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.submissions}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "conversion",
      header: "Conversion",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.conversion}</span>,
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
        <div className="flex flex-wrap items-center justify-end gap-1 md:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFormStatus(row.id);
              toast.success(`Formulaire ${row.status === "live" ? "mis en brouillon" : "publié"}`);
            }}
          >
            <Badge tone={row.status === "live" ? "primary" : "muted"}>
              {row.status === "live" ? "En ligne" : "Brouillon"}
            </Badge>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(
                `<script src="https://leadcortex.io/f/${row.id}.js"></script>`,
              );
              toast.success("Snippet copié");
            }}
            className="text-[9px] md:text-xs inline-flex items-center gap-0.5 md:gap-1 text-muted-foreground hover:text-foreground"
          >
            <Code className="size-2.5 md:size-3" /> Intégrer
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 md:p-1 rounded hover:bg-secondary"
          >
            <MoreHorizontal className="size-3.5 md:size-4" />
          </button>
        </div>
      ),
      className: "w-32 md:w-48",
    },
  ];

  // Empty state
  if (forms.length === 0) {
    return (
      <div className="max-w-5xl">
        <PageHeader
          eyebrow="Inbound · Formulaires"
          title="Captez vos leads inbound."
          description="Créez des formulaires branchés au pipeline. Enrichissement automatique."
          actions={
            <button
              onClick={() => toast.info("Ouvre le builder de formulaire.")}
              className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
            >
              <Plus className="size-3 md:size-3.5" /> Créer un formulaire
            </button>
          }
        />
        <EmptyState
          icon={FileInput}
          title="Aucun formulaire"
          description="Créez votre premier formulaire pour capturer des leads inbound."
          action={{
            label: "Créer un formulaire",
            onClick: () => toast.info("Ouvre le builder de formulaire."),
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
        title="Captez vos leads inbound."
        description="Créez des formulaires branchés au pipeline. Enrichissement automatique."
        actions={
          <button
            onClick={() => toast.info("Ouvre le builder de formulaire.")}
            className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
          >
            <Plus className="size-3 md:size-3.5" /> Créer un formulaire
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-8">
        <Kpi
          label="Formulaires actifs"
          value={String(live)}
          sub={`${forms.length - live} en brouillon`}
        />
        <Kpi label="Soumissions" value={String(total)} delta="+18%" up sub="tous formulaires" />
        <Kpi label="Conversion moyenne" value="8.2%" delta="+1.4%" up />
      </div>

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
