// frontend/routes/app/calls/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import DataTable, { type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  PlayCircle,
} from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/calls/")({
  head: () => ({ meta: [{ title: "Appels · LeadCortex" }] }),
  pendingComponent: () => <TableViewSkeleton label="Chargement des appels" rows={8} />,
  component: CallsPage,
});

const OUTCOME_LABELS = {
  connected: "Joint",
  voicemail: "Messagerie",
  "no-answer": "Sans réponse",
  "meeting-booked": "RDV pris",
} as const;

function CallsPage() {
  const { calls } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columns: Column<(typeof calls)[number]>[] = [
    {
      key: "contact",
      header: "Contact",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="text-[13px] font-medium md:text-sm">{row.contact}</p>
          <p className="text-xs text-muted-foreground">{row.company}</p>
        </div>
      ),
      cellClassName: "min-w-[120px] md:min-w-[160px]",
    },
    {
      key: "direction",
      header: "Sens",
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
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Icon
              className={`size-3.5 ${
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
      accessor: (row) => <span className="text-[13px] tabular-nums">{row.duration}</span>,
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
          {OUTCOME_LABELS[row.outcome]}
        </Badge>
      ),
    },
    {
      key: "time",
      header: "Quand",
      sortable: true,
      accessor: (row) => <span className="text-xs text-muted-foreground">{row.time}</span>,
      className: "text-right",
      cellClassName: "text-right",
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center justify-end">
          {row.duration !== "0:00" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Lecture de l'enregistrement...");
              }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <PlayCircle className="size-3.5" /> Écouter
            </button>
          )}
        </div>
      ),
      className: "w-20 md:w-24",
    },
  ];

  const startCall = () => toast.success("Appel en cours...");
  const newCallButton = (
    <Button onClick={startCall}>
      <PhoneCall /> Nouvel appel
    </Button>
  );

  if (calls.length === 0) {
    return (
      <div className="max-w-6xl">
        <PageHeader eyebrow="Appels" title="Vos appels." actions={newCallButton} />
        <EmptyState
          icon={Phone}
          title="Aucun appel pour l'instant"
          action={{ label: "Nouvel appel", onClick: startCall, icon: PhoneCall }}
        />
      </div>
    );
  }

  const reached = calls.filter(
    (c) => c.outcome === "connected" || c.outcome === "meeting-booked",
  ).length;
  const booked = calls.filter((c) => c.outcome === "meeting-booked").length;

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Appels"
        title="Vos appels."
        description={`${calls.length} appels, ${reached} joints, ${booked} RDV pris`}
        actions={newCallButton}
      />

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

      <section className="mt-8 border-t border-border pt-6 md:mt-12">
        <h2 className="text-base font-semibold">Composer un numéro</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          L'appel est enregistré, transcrit puis résumé.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            placeholder="+33 6 ..."
            inputMode="tel"
            aria-label="Numéro de téléphone"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-9 sm:w-56"
          />
          <Button variant="outline" onClick={startCall} className="h-11 sm:h-9">
            <Phone /> Appeler
          </Button>
        </div>
      </section>
    </div>
  );
}
