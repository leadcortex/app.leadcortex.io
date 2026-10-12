//frontend\routes\app.deals.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge, Kpi } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { Plus, ArrowRight, Target } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { DealsPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/deals")({
  head: () => ({ meta: [{ title: "Opportunités — LeadCortex" }] }),
  pendingComponent: () => <DealsPageSkeleton />,
  component: DealsPage,
});

const stages = [
  { key: "qualified", label: "Qualifiés" },
  { key: "proposal", label: "Proposition" },
  { key: "negotiation", label: "Négociation" },
  { key: "won", label: "Gagnés" },
  { key: "lost", label: "Perdus" },
] as const;

function DealsPage() {
  const navigate = useNavigate();
  const { deals, advanceDealStage, addDeal, addActivity } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const total = deals.reduce((n, d) => n + d.amount * (d.probability / 100), 0);
  const won = deals.filter((d) => d.stage === "won").reduce((n, d) => n + d.amount, 0);

  const columns: Column<(typeof deals)[number]>[] = [
    {
      key: "name",
      header: "Opportunité",
      sortable: true,
      accessor: (row) => (
        <div>
          <div className="font-medium text-xs md:text-sm">{row.name}</div>
          <div className="text-[9px] md:text-xs text-muted-foreground">{row.company}</div>
        </div>
      ),
      cellClassName: "min-w-[120px] md:min-w-[180px]",
    },
    {
      key: "contact",
      header: "Contact",
      sortable: true,
      accessor: (row) => row.contact,
      hideOnMobile: true,
    },
    {
      key: "stage",
      header: "Étape",
      sortable: true,
      accessor: (row) => (
        <Badge
          tone={
            row.stage === "won"
              ? "success"
              : row.stage === "negotiation"
                ? "primary"
                : row.stage === "lost"
                  ? "destructive"
                  : "muted"
          }
        >
          {row.stage}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      sortable: true,
      accessor: (row) => (
        <span className="font-mono text-xs md:text-sm">{row.amount.toLocaleString("fr-FR")} €</span>
      ),
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "probability",
      header: "Probabilité",
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-1 md:gap-2">
          <span className="font-mono text-[10px] md:text-sm">{row.probability}%</span>
          <div className="flex-1 h-1 md:h-1.5 bg-secondary rounded-full overflow-hidden max-w-[40px] md:max-w-[80px]">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${row.probability}%` }}
            />
          </div>
        </div>
      ),
      cellClassName: "min-w-[80px] md:min-w-[120px]",
    },
    {
      key: "close",
      header: "Clôture",
      sortable: true,
      accessor: (row) => (
        <span className="text-[10px] md:text-xs text-muted-foreground">{row.close}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => {
        if (row.stage === "won" || row.stage === "lost") {
          return null;
        }
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              advanceDealStage(row.id);
              addActivity("Étape avancée", row.name);
              toast.success(`${row.name} → étape suivante`);
            }}
            className="inline-flex items-center gap-0.5 md:gap-1 text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-border hover:bg-surface transition-colors"
          >
            Avancer <ArrowRight className="size-2.5 md:size-3" />
          </button>
        );
      },
      className: "w-16 md:w-24",
    },
  ];

  const stageCounts = stages.map((s) => ({
    ...s,
    items: deals.filter((d) => d.stage === s.key),
    sum: deals.filter((d) => d.stage === s.key).reduce((n, d) => n + d.amount, 0),
  }));

  const handleCreateDeal = () => {
    addDeal({
      name: "Nouvelle opportunité",
      company: "—",
      contact: "—",
      amount: 10000,
      stage: "qualified",
      probability: 20,
      close: "à définir",
    });
    addActivity("Opportunité créée", "Nouvelle entrée dans le pipeline");
    toast.success("Opportunité créée");
  };

  // Empty state
  if (deals.length === 0) {
    return (
      <div className="max-w-full">
        <PageHeader
          eyebrow="Opportunités"
          title="Le pipeline."
          description="Aucune opportunité pour le moment."
          actions={
            <button
              onClick={handleCreateDeal}
              className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
            >
              <Plus className="size-3 md:size-3.5" /> Nouvelle opportunité
            </button>
          }
        />
        <EmptyState
          icon={Target}
          title="Pipeline vide"
          description="Créez votre première opportunité pour suivre vos deals."
          action={{
            label: "Créer une opportunité",
            onClick: handleCreateDeal,
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
        eyebrow="Opportunités"
        title="Le pipeline."
        description={`${deals.length} opportunités · Pipeline pondéré ${Math.round(total).toLocaleString("fr-FR")} €`}
        actions={
          <button
            onClick={handleCreateDeal}
            className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
          >
            <Plus className="size-3 md:size-3.5" /> Nouvelle opportunité
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
        <Kpi
          label="Pipeline total"
          value={`${deals.reduce((n, d) => n + d.amount, 0).toLocaleString("fr-FR")} €`}
        />
        <Kpi label="Gagnés" value={`${(won / 1000).toFixed(0)}K€`} delta="+42%" up />
        <Kpi label="Taux conversion" value="24%" delta="+3%" up />
        <Kpi label="Cycle moyen" value="28j" sub="qualif → closing" />
      </div>

      <div className="overflow-x-auto scrollbar-hide table-scroll mb-4 md:mb-8">
        <div className="grid grid-cols-5 gap-2 md:gap-3 min-w-[600px]">
          {stageCounts.map((s) => (
            <div
              key={s.key}
              className="rounded-xl bg-surface/40 border border-border flex flex-col min-h-[200px] md:min-h-[300px]"
            >
              <div className="p-2 md:p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] md:text-xs font-semibold uppercase tracking-[0.12em]">
                    {s.label}
                  </p>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground font-mono">
                    {s.items.length}
                  </span>
                </div>
                <p className="text-[9px] md:text-[11px] text-muted-foreground font-mono mt-0.5">
                  {s.sum.toLocaleString("fr-FR")} €
                </p>
              </div>
              <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-2 flex-1 overflow-y-auto">
                {s.items.map((d) => (
                  <div
                    key={d.id}
                    className="p-2 md:p-3 rounded-lg bg-background border border-border hover:shadow-[var(--shadow-card)] transition-all group"
                  >
                    <p className="text-[10px] md:text-xs font-medium leading-tight">{d.name}</p>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground mt-0.5 md:mt-1">
                      {d.contact}
                    </p>
                    <div className="mt-2 md:mt-3 flex items-center justify-between">
                      <p className="font-mono text-[10px] md:text-sm">
                        {(d.amount / 1000).toFixed(0)}K€
                      </p>
                      <span className="text-[8px] md:text-[10px] text-muted-foreground">
                        {d.probability}% · {d.close}
                      </span>
                    </div>
                    <div className="mt-1.5 md:mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${d.probability}%` }}
                      />
                    </div>
                  </div>
                ))}
                {s.items.length === 0 && (
                  <div className="text-[8px] md:text-[10px] text-muted-foreground text-center py-3 md:py-4">
                    Vide
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-semibold text-sm md:text-base mb-2 md:mb-4">Toutes les opportunités</h2>
      <DataTable
        data={deals}
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
            setSelectedIds(new Set(deals.map((d) => d.id)));
          } else {
            setSelectedIds(new Set());
          }
        }}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Nom, entreprise, contact..."
        searchFields={["name", "company", "contact"]}
        emptyMessage="Aucune opportunité dans le pipeline."
      />
    </div>
  );
}
