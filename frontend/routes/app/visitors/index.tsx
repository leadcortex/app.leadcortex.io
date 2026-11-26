// frontend/routes/app/visitors/index.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import DataTable, { type Column } from "@/components/common/data-table";
import { visitors } from "@/lib/data/mock-data";
import { Eye, Building2, MapPin } from "@/components/icons";
import { useState } from "react";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/visitors/")({
  head: () => ({ meta: [{ title: "Visiteurs · LeadCortex" }] }),
  pendingComponent: () => <TableViewSkeleton label="Chargement des visiteurs" rows={8} />,
  component: VisitorsPage,
});

const intentLabels: Record<string, string> = { hot: "Forte", warm: "Moyenne", cold: "Faible" };

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
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-[13px] font-medium">{row.company}</p>
        </div>
      ),
      cellClassName: "min-w-[120px] md:min-w-[160px]",
    },
    {
      key: "location",
      header: "Localisation",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {row.location}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "pages",
      header: "Pages",
      sortable: true,
      accessor: (row) => <span className="text-[13px] tabular-nums">{row.pages}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "duration",
      header: "Durée",
      sortable: true,
      accessor: (row) => <span className="text-[13px] tabular-nums">{row.duration}</span>,
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
          {intentLabels[row.intent] ?? row.intent}
        </Badge>
      ),
    },
    {
      key: "time",
      header: "Quand",
      sortable: true,
      accessor: (row) => (
        <span className="text-xs text-muted-foreground">{row.time}</span>
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
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Eye className="size-3" /> Détails
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
          description="Les entreprises reconnues à partir de leur adresse IP et de leurs visites."
        />
        <EmptyState
          icon={Eye}
          title="Aucun visiteur"
          description="Installez le script de suivi pour voir les entreprises qui passent sur votre site."
          size="lg"
        />
        <section className="mt-8 md:mt-12 border-t border-border pt-6">
          <h2 className="text-base font-semibold">Script de suivi</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            À coller dans la balise &lt;head&gt; de votre site.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card p-3 font-mono text-xs">
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
        description="Les entreprises reconnues à partir de leur adresse IP et de leurs visites."
      />

      <p className="mb-6 text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{visitors.length}</span>{" "}
        entreprises identifiées, dont{" "}
        <span className="font-medium text-foreground tabular-nums">
          {visitors.filter((v) => v.intent === "hot").length}
        </span>{" "}
        avec une forte intention.
      </p>

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

      <section className="mt-8 md:mt-12 border-t border-border pt-6">
        <h2 className="text-base font-semibold">Script de suivi</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          À coller dans la balise &lt;head&gt; de votre site.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card p-3 font-mono text-xs">
          {`<script src="https://leadcortex.io/track.js" data-workspace="acme-b2b"></script>`}
        </div>
      </section>
    </div>
  );
}
