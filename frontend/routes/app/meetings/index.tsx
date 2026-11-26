// frontend/routes/app/meetings/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/ui-primitives";
import DataTable, { type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { CalendarDays, Video, Plus, Clock } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { MeetingsPageSkeleton } from "@/components/skeletons";
import { BookingLinkModal } from "@/components/meetings/booking-link-modal";
import { BookingLinksBoard } from "@/components/meetings/booking-links-board";
import { mockBookingLinks, type BookingLink } from "@/lib/meetings/booking-mock";

export const Route = createFileRoute("/app/meetings/")({
  head: () => ({ meta: [{ title: "Rendez-vous · LeadCortex" }] }),
  pendingComponent: () => <MeetingsPageSkeleton />,
  component: MeetingsPage,
});

const typeLabel = {
  discovery: "Découverte",
  demo: "Démo",
  "follow-up": "Suivi",
  closing: "Closing",
} as const;

function MeetingsPage() {
  const { meetings } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingView, setBookingView] = useState<"list" | "wizard">("wizard");
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>(mockBookingLinks);

  const openBooking = (view: "list" | "wizard") => {
    setBookingView(view);
    setBookingOpen(true);
  };

  const columns: Column<(typeof meetings)[number]>[] = [
    {
      key: "title",
      header: "Rendez-vous",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="text-[13px] font-medium md:text-sm">{row.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {typeLabel[row.type]} · {row.with}, {row.company}
          </p>
        </div>
      ),
      cellClassName: "min-w-[160px] md:min-w-[240px]",
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="text-[13px] font-medium md:text-sm">{row.date}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{row.time}</p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Durée",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {row.duration}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: () => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Ouverture du lien de visio...");
          }}
        >
          <Video /> Rejoindre
        </Button>
      ),
      className: "w-24 md:w-28",
    },
  ];

  const hasMeetings = meetings.length > 0;
  const hasLinks = bookingLinks.length > 0;

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Rendez-vous"
        title="Vos rendez-vous."
        description={
          hasMeetings
            ? `${meetings.length} rendez-vous, pris via vos liens ou importés de votre agenda`
            : "Pris via vos liens ou importés de votre agenda"
        }
        actions={
          <>
            <Button variant="outline" onClick={() => openBooking("list")}>
              <CalendarDays /> Mes liens ({bookingLinks.length})
            </Button>
            <Button onClick={() => openBooking("wizard")}>
              <Plus /> Créer un lien
            </Button>
          </>
        }
      />

      {hasMeetings ? (
        <DataTable
          data={meetings}
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
              setSelectedIds(new Set(meetings.map((m) => m.id)));
            } else {
              setSelectedIds(new Set());
            }
          }}
          pageSize={10}
          showPagination={true}
          showSearch={true}
          searchPlaceholder="Titre, contact, entreprise..."
          searchFields={["title", "with", "company"]}
          emptyMessage="Aucun rendez-vous prévu."
        />
      ) : hasLinks ? (
        <p className="text-sm text-muted-foreground">
          Aucun rendez-vous prévu. Partagez un de vos liens ci-dessous pour en recevoir.
        </p>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Aucun rendez-vous"
          action={{
            label: "Créer un lien de réservation",
            onClick: () => openBooking("wizard"),
            icon: Plus,
          }}
        />
      )}

      {hasLinks && (
        <BookingLinksBoard
          links={bookingLinks}
          onCreate={() => openBooking("wizard")}
          onToggle={(id) =>
            setBookingLinks((l) => l.map((x) => (x.id === id ? { ...x, active: !x.active } : x)))
          }
          onDelete={(id) => {
            setBookingLinks((l) => l.filter((x) => x.id !== id));
            toast.success("Lien supprimé");
          }}
        />
      )}

      <BookingLinkModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialView={bookingView}
        links={bookingLinks}
        onLinksChange={setBookingLinks}
      />
    </div>
  );
}
