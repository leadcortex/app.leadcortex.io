// frontend/components/meetings/booking-links-board.tsx

import { Clock, Copy, MapPin, Plus, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/common/ui-primitives";
import { LOCATION_LABELS, bookingUrl, type BookingLink } from "@/lib/meetings/booking-mock";

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
  const totalBookings = links.reduce((s, l) => s + l.bookings, 0);

  return (
    <section className="mt-8 md:mt-12">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Liens de réservation</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {links.length} lien{links.length > 1 ? "s" : ""}, {totalBookings} RDV réservés
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCreate} className="shrink-0">
          <Plus /> Nouveau lien
        </Button>
      </header>

      {links.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun lien pour l'instant.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {links.map((l) => {
            const url = bookingUrl(l.slug);
            return (
              <li key={l.id} className="p-4 md:flex md:items-center md:gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{l.name}</span>
                    <Badge tone={l.active ? "success" : "muted"} className="shrink-0">
                      {l.active ? "Actif" : "En pause"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {l.duration} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {LOCATION_LABELS[l.location]}
                    </span>
                    <span className="tabular-nums">
                      {l.views} vues · {l.bookings} RDV
                    </span>
                    <span>Créé {l.createdAt}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 md:mt-0 md:shrink-0">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-surface/60 px-2 py-1.5 font-mono text-[11px] md:max-w-[220px] md:text-xs">
                    {url}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copier le lien"
                    className="size-11 md:size-8"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`https://${url}`);
                      toast.success("Lien copié");
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 md:h-8"
                    onClick={() => onToggle(l.id)}
                  >
                    {l.active ? "Pause" : "Activer"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer le lien"
                    className="size-11 text-destructive md:size-8"
                    onClick={() => onDelete(l.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
