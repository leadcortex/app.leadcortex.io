//frontend\routes\app.visitors.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge, Kpi } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { visitors } from "@/lib/mock-data";
import { Eye, Building2, MapPin } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/visitors")({
  head: () => ({ meta: [{ title: "Visiteurs — LeadCortex" }] }),
  pendingComponent: () => <TableViewSkeleton label="Chargement des visiteurs" rows={8} />,
  component: VisitorsPage,
});

function VisitorsPage() {
  const navigate = useNavigate();
  const { visitors } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columns: Column<(typeof visitors)[number]>[] = [
    {
      key: "company",
      header: "Entreprise",
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="size-6 md:size-7 rounded-md bg-secondary grid place-items-center">
            <Building2 className="size-3 md:size-3.5 text-muted-foreground" />
          </div>
          <p className="font-medium text-xs md:text-sm">{row.company}</p>
        </div>
      ),
      cellClassName: "min-w-[120px] md:min-w-[160px]",
    },
    {
      key: "location",
      header: "Localisation",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
          <MapPin className="size-2.5 md:size-3" />
          {row.location}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "pages",
      header: "Pages",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.pages}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "duration",
      header: "Durée",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.duration}</span>,
      className: "text-center",
      cellClassName: "text-center",
      hideOnMobile: true,
    },
    {
      key: "intent",
      header: "Intention",
      sortable: true,
      accessor: (row) => (
        <Badge
          tone={row.intent === "hot" ? "primary" : row.intent === "warm" ? "warning" : "muted"}
        >
          {row.intent}
        </Badge>
      ),
    },
    {
      key: "time",
      header: "Quand",
      sortable: true,
      accessor: (row) => (
        <span className="text-[9px] md:text-xs text-muted-foreground">{row.time}</span>
      ),
      className: "text-right",
      cellClassName: "text-right",
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="text-[9px] md:text-xs text-primary hover:underline inline-flex items-center gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="size-2.5 md:size-3" /> Détails
        </button>
      ),
      className: "w-14 md:w-20",
      cellClassName: "group-hover:opacity-100",
    },
  ];

  if (visitors.length === 0) {
    return (
      <div className="max-w-full">
        <PageHeader
          eyebrow="Inbound · Visiteurs"
          title="Qui visite votre site."
          description="Identification anonyme des entreprises via IP + signaux."
        />
        <EmptyState
          icon={Eye}
          title="Aucun visiteur"
          description="Installez le script de tracking pour identifier les entreprises qui visitent votre site."
          size="lg"
        />
        <section className="mt-4 md:mt-8 rounded-xl border border-dashed border-border bg-surface/30 p-4 md:p-6 text-xs md:text-sm">
          <p className="font-medium">Script de tracking</p>
          <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">
            Installez ce snippet dans le &lt;head&gt; de votre site pour identifier vos visiteurs.
          </p>
          <div className="mt-2 md:mt-3 rounded-md bg-background border border-border p-2 md:p-3 font-mono text-[9px] md:text-xs overflow-x-auto">
            {`<script src="https://leadcortex.io/track.js" data-workspace="acme-b2b"></script>`}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Inbound · Visiteurs"
        title="Qui visite votre site."
        description="Identification anonyme des entreprises via IP + signaux."
      />

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
        <Kpi label="Visiteurs identifiés" value="147" delta="+22%" up sub="cette semaine" />
        <Kpi label="Intention forte" value="18" sub="≥ 5 pages visitées" />
        <Kpi label="Durée moyenne" value="2m 18s" />
        <Kpi label="Retours" value="41%" sub="visiteurs récurrents" />
      </div>

      {}
      <DataTable
        data={visitors}
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
            setSelectedIds(new Set(visitors.map((v) => v.id)));
          } else {
            setSelectedIds(new Set());
          }
        }}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Entreprise, localisation..."
        searchFields={["company", "location"]}
        emptyMessage="Aucun visiteur identifié."
      />

      {}
      <section className="mt-4 md:mt-8 rounded-xl border border-dashed border-border bg-surface/30 p-4 md:p-6 text-xs md:text-sm">
        <p className="font-medium">Script de tracking</p>
        <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5 md:mt-1">
          Installez ce snippet dans le &lt;head&gt; de votre site pour identifier vos visiteurs.
        </p>
        <div className="mt-2 md:mt-3 rounded-md bg-background border border-border p-2 md:p-3 font-mono text-[9px] md:text-xs overflow-x-auto">
          {`<script src="https://leadcortex.io/track.js" data-workspace="acme-b2b"></script>`}
        </div>
      </section>
    </div>
  );
}
