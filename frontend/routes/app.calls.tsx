//frontend\routes\app.calls.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge, Kpi } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { calls } from "@/lib/mock-data";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  PlayCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/calls")({
  head: () => ({ meta: [{ title: "Appels — LeadCortex" }] }),
  pendingComponent: () => <TableViewSkeleton label="Chargement des appels" rows={8} />,
  component: CallsPage,
});

function CallsPage() {
  const navigate = useNavigate();
  const { calls } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columns: Column<(typeof calls)[number]>[] = [
    {
      key: "contact",
      header: "Contact",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="font-medium text-xs md:text-sm">{row.contact}</p>
          <p className="text-[9px] md:text-xs text-muted-foreground">{row.company}</p>
        </div>
      ),
      cellClassName: "min-w-[120px] md:min-w-[160px]",
    },
    {
      key: "direction",
      header: "Direction",
      sortable: true,
      accessor: (row) => {
        const Icon =
          row.outcome === "voicemail"
            ? Voicemail
            : row.outcome === "no-answer"
              ? PhoneMissed
              : row.direction === "inbound"
                ? PhoneIncoming
                : PhoneOutgoing;
        return (
          <span className="inline-flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-muted-foreground">
            <Icon
              className={`size-3 md:size-3.5 ${
                row.outcome === "no-answer" || row.outcome === "voicemail"
                  ? "text-muted-foreground"
                  : "text-primary"
              }`}
            />
            {row.direction === "inbound" ? "Entrant" : "Sortant"}
          </span>
        );
      },
      hideOnMobile: true,
    },
    {
      key: "duration",
      header: "Durée",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.duration}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "outcome",
      header: "Résultat",
      sortable: true,
      accessor: (row) => (
        <Badge
          tone={
            row.outcome === "meeting-booked"
              ? "success"
              : row.outcome === "connected"
                ? "primary"
                : "muted"
          }
        >
          {row.outcome}
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
        <div className="flex items-center justify-end gap-1">
          {row.duration !== "0:00" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Lecture de l'enregistrement...");
              }}
              className="text-[9px] md:text-xs inline-flex items-center gap-0.5 md:gap-1 text-primary hover:underline"
            >
              <PlayCircle className="size-2.5 md:size-3.5" /> Écouter
            </button>
          )}
        </div>
      ),
      className: "w-16 md:w-24",
    },
  ];

  // Empty state
  if (calls.length === 0) {
    return (
      <div className="max-w-full">
        <PageHeader
          eyebrow="Appels"
          title="Vos appels."
          description="Historique, enregistrements et transcripts."
          actions={
            <button className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all">
              <PhoneCall className="size-3 md:size-3.5" /> Nouvel appel
            </button>
          }
        />
        <EmptyState
          icon={Phone}
          title="Aucun appel"
          description="Commencez à passer des appels pour engager vos prospects."
          action={{
            label: "Nouvel appel",
            onClick: () => toast.success("Appel en cours..."),
            icon: PhoneCall,
          }}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Appels"
        title="Vos appels."
        description="Historique, enregistrements et transcripts."
        actions={
          <button className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all">
            <PhoneCall className="size-3 md:size-3.5" /> Nouvel appel
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <Kpi label="Appels cette semaine" value="42" delta="+18%" up />
        <Kpi label="Taux de connexion" value="38%" sub="16 connectés" />
        <Kpi label="Durée moyenne" value="6:24" sub="par appel" />
        <Kpi label="RDV bookés" value="7" delta="+3" up />
      </div>

      <DataTable
        data={calls}
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
            setSelectedIds(new Set(calls.map((c) => c.id)));
          } else {
            setSelectedIds(new Set());
          }
        }}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Contact, entreprise..."
        searchFields={["contact", "company"]}
        emptyMessage="Aucun appel enregistré."
      />

      <section className="mt-4 md:mt-8 rounded-xl border border-border bg-background p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <div className="size-10 md:size-12 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
            <Phone className="size-4 md:size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm md:text-base">Composer un numéro</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Enregistrement automatique + transcription IA + résumé.
            </p>
          </div>
          <input
            placeholder="+33 6 ..."
            className="w-full sm:w-40 md:w-48 px-2 md:px-3 py-1.5 md:py-2 rounded-md border border-border text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => toast.success("Appel en cours...")}
            className="w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs bg-primary text-primary-foreground rounded-md hover:brightness-110"
          >
            Appeler
          </button>
        </div>
      </section>
    </div>
  );
}
