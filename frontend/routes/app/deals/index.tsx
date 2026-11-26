// frontend/routes/app/deals/index.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import DataTable, { type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Target } from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { DealsPageSkeleton } from "@/components/skeletons";
import { ProgressCapsule } from "@/components/ui/capsule-progress";

export const Route = createFileRoute("/app/deals/")({
  head: () => ({ meta: [{ title: "Opportunités · LeadCortex" }] }),
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

const STAGE_LABELS: Record<string, string> = {
  qualified: "Qualifié",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  lost: "Perdu",
};

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const hasValue = (v?: string) => Boolean(v && v !== "—");

function DealsPage() {
  const { deals, advanceDealStage, addDeal, addActivity } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const openSum = open.reduce((n, d) => n + d.amount, 0);
  const won = deals.filter((d) => d.stage === "won").reduce((n, d) => n + d.amount, 0);

  const columns: Column<(typeof deals)[number]>[] = [
    {
      key: "name",
      header: "Opportunité",
      sortable: true,
      accessor: (row) => (
        <div>
          <div className="text-[13px] font-medium md:text-sm">{row.name}</div>
          {hasValue(row.company) && (
            <div className="text-xs text-muted-foreground">{row.company}</div>
          )}
        </div>
      ),
      cellClassName: "min-w-[140px] md:min-w-[180px]",
    },
    {
      key: "contact",
      header: "Contact",
      sortable: true,
      accessor: (row) => (hasValue(row.contact) ? row.contact : ""),
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
          {STAGE_LABELS[row.stage] ?? row.stage}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      sortable: true,
      accessor: (row) => <span className="text-[13px] tabular-nums">{euros(row.amount)}</span>,
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "probability",
      header: "Probabilité",
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums">{row.probability} %</span>
          <div className="max-w-[48px] flex-1 md:max-w-[80px]">
            <ProgressCapsule value={row.probability} max={100} size="sm" />
          </div>
        </div>
      ),
      cellClassName: "min-w-[96px] md:min-w-[120px]",
    },
    {
      key: "close",
      header: "Clôture",
      sortable: true,
      accessor: (row) => <span className="text-xs text-muted-foreground">{row.close}</span>,
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
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              advanceDealStage(row.id);
              addActivity("Étape avancée", row.name);
              toast.success(`${row.name} passe à l'étape suivante`);
            }}
          >
            Avancer <ArrowRight />
          </Button>
        );
      },
      className: "w-20 md:w-28",
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
      company: "",
      contact: "",
      amount: 10000,
      stage: "qualified",
      probability: 20,
      close: "à définir",
    });
    addActivity("Opportunité créée", "Ajoutée au pipeline");
    toast.success("Opportunité créée");
  };

  const createButton = (
    <Button onClick={handleCreateDeal}>
      <Plus /> Nouvelle opportunité
    </Button>
  );

  if (deals.length === 0) {
    return (
      <div className="max-w-full">
        <PageHeader eyebrow="Opportunités" title="Le pipeline." actions={createButton} />
        <EmptyState
          icon={Target}
          title="Aucune opportunité pour l'instant"
          action={{
            label: "Créer une opportunité",
            onClick: handleCreateDeal,
            icon: Plus,
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Opportunités"
        title="Le pipeline."
        description={`${open.length} en cours pour ${euros(openSum)} · ${euros(won)} gagnés`}
        actions={createButton}
      />

      <div className="table-scroll scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="grid min-w-[880px] grid-cols-5 gap-3 md:min-w-0">
          {stageCounts.map((s) => (
            <section
              key={s.key}
              className="flex min-h-[200px] flex-col rounded-xl bg-surface/40 md:min-h-[320px]"
            >
              <header className="flex items-baseline justify-between gap-2 px-3 pb-2 pt-3">
                <h2 className="text-[13px] font-semibold">
                  {s.label}
                  <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                    {s.items.length}
                  </span>
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {euros(s.sum)}
                </span>
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {s.items.map((d) => (
                  <Link
                    key={d.id}
                    to="/app/deals/$id"
                    params={{ id: d.id }}
                    className="block rounded-lg border border-border bg-background p-3 transition-colors duration-150 ease-out hover:bg-surface/70"
                  >
                    <p className="text-[13px] font-medium leading-snug">{d.name}</p>
                    {hasValue(d.contact) && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{d.contact}</p>
                    )}
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <p className="text-[13px] font-medium tabular-nums">{euros(d.amount)}</p>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {d.probability} % · {d.close}
                      </span>
                    </div>
                  </Link>
                ))}
                {s.items.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">Aucune</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-base font-semibold md:mt-12">Toutes les opportunités</h2>
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
