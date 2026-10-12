//frontend\components\meetings\booking-links-board.tsx
import { CalendarDays, Clock, Copy, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LOCATION_LABELS, bookingUrl, type BookingLink } from "@/lib/booking-mock";

export function BookingLinksBoard({
  links,
  onCreate,
  onToggle,
  onDelete,
}: {
  links: BookingLink[];
  onCreate: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const totalViews = links.reduce((s, l) => s + l.views, 0);
  const totalBookings = links.reduce((s, l) => s + l.bookings, 0);

  return (
    <section className="mt-4 md:mt-8 rounded-xl border border-border bg-surface/40 p-4 md:p-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <CalendarDays className="size-6 shrink-0 text-primary md:size-7" strokeWidth={1.5} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium md:text-base">Liens de booking</h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
              {links.length} lien{links.length > 1 ? "s" : ""} · {totalViews} vues · {totalBookings}{" "}
              RDV réservés
            </p>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-[10px] text-background hover:opacity-90 md:text-xs"
        >
          <Plus className="size-3.5" /> Nouveau lien
        </button>
      </header>

      {links.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-[11.5px] text-muted-foreground">
          Aucun lien de booking pour le moment. Créez-en un pour laisser vos prospects réserver un
          créneau.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {links.map((l) => {
            const url = bookingUrl(l.slug);
            return (
              <li
                key={l.id}
                className="rounded-lg border border-border bg-background p-3 md:flex md:items-center md:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] font-medium">{l.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] ${
                        l.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {l.active ? "Actif" : "En pause"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {l.duration} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {LOCATION_LABELS[l.location]}
                    </span>
                    <span>{l.views} vues</span>
                    <span>{l.bookings} RDV</span>
                    <span>Créé {l.createdAt}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1.5 md:mt-0 md:shrink-0">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-surface/60 px-2 py-1 font-mono text-[10px] md:max-w-[220px] md:text-[11px]">
                    {url}
                  </code>
                  <button
                    aria-label="Copier le lien"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`https://${url}`);
                      toast.success("Lien copié");
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-md border border-border hover:bg-surface"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onToggle(l.id)}
                    className="shrink-0 rounded-md border border-border px-2 py-1 text-[10.5px] hover:bg-surface"
                  >
                    {l.active ? "Pause" : "Activer"}
                  </button>
                  <button
                    aria-label="Supprimer le lien"
                    onClick={() => onDelete(l.id)}
                    className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-destructive hover:bg-surface"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
