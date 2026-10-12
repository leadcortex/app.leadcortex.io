//frontend\routes\app.meetings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Kpi } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { CalendarDays, Video, Plus, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { MeetingsPageSkeleton } from "@/components/skeletons";
import { BookingLinkModal } from "@/components/meetings/booking-link-modal";
import { BookingLinksBoard } from "@/components/meetings/booking-links-board";
import { mockBookingLinks, type BookingLink } from "@/lib/booking-mock";

export const Route = createFileRoute("/app/meetings")({
  head: () => ({ meta: [{ title: "Meetings — LeadCortex" }] }),
  pendingComponent: () => <MeetingsPageSkeleton />,
  component: MeetingsPage,
});
const typeColor = {
  discovery: "bg-primary/10 text-primary",
  demo: "bg-warning/14 text-warning",
  "follow-up": "bg-secondary text-muted-foreground",
  closing: "bg-success/14 text-success",
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
      header: "Meeting",
      sortable: true,
      accessor: (row) => (
        <div>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <p className="font-medium text-xs md:text-sm">{row.title}</p>
            <span
              className={`text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full uppercase font-semibold tracking-wide ${typeColor[row.type]}`}
            >
              {row.type}
            </span>
          </div>
          <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
            {row.with} · {row.company}
          </p>
        </div>
      ),
      cellClassName: "min-w-[140px] md:min-w-[220px]",
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="font-medium text-xs md:text-sm">{row.date}</p>
          <p className="text-[9px] md:text-xs text-muted-foreground">{row.time}</p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Durée",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
          <Clock className="size-2.5 md:size-3" /> {row.duration}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: () => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Ouverture du lien de visio...");
          }}
          className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1.5 rounded-md bg-primary/10 text-primary text-[9px] md:text-xs hover:brightness-110 transition-all"
        >
          <Video className="size-2.5 md:size-3.5" /> Rejoindre
        </button>
      ),
      className: "w-16 md:w-24",
    },
  ];

  const hasMeetings = meetings.length > 0;
  const hasLinks = bookingLinks.length > 0;

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Meetings"
        title="Vos rendez-vous."
        description="Bookés via Cortex ou synchronisés depuis votre calendrier."
        actions={
          <>
            <button
              onClick={() => openBooking("list")}
              className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs border border-border rounded-md hover:bg-surface transition-all"
            >
              <CalendarDays className="size-3 md:size-3.5" /> Mes liens ({bookingLinks.length})
            </button>
            <button
              onClick={() => openBooking("wizard")}
              className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
            >
              <Plus className="size-3 md:size-3.5" /> Créer un lien de booking
            </button>
          </>
        }
      />

      {hasMeetings ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
            <Kpi label="Cette semaine" value="8" sub="4 confirmés" />
            <Kpi label="Taux de show-up" value="82%" delta="+6%" up />
            <Kpi label="Durée moyenne" value="34min" />
            <Kpi label="Conversion démo" value="41%" delta="+3%" up />
          </div>

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
            emptyMessage="Aucun meeting planifié."
          />
        </>
      ) : hasLinks ? (
        <div className="mb-4 md:mb-6 p-4 rounded-xl border border-border bg-surface/40 text-center text-muted-foreground text-sm">
          <p>
            Aucun meeting planifié pour l'instant. Utilisez vos liens de booking ci-dessous pour
            inviter vos prospects.
          </p>
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Aucun meeting"
          description="Planifiez vos premiers rendez-vous avec vos prospects."
          action={{
            label: "Créer un lien de booking",
            onClick: () => openBooking("wizard"),
            icon: Plus,
          }}
          size="lg"
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
