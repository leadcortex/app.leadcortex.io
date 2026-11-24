// frontend/components/hub/meetings-view.tsx

import { useMemo } from "react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Plus,
  Video,
} from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { Badge } from "@/components/common/ui-primitives";
import { cn } from "@/lib/core/utils";

const TYPE_LABEL: Record<string, string> = {
  discovery: "Discovery",
  demo: "Démo",
  "follow-up": "Suivi",
  closing: "Closing",
};

const TYPE_TONE: Record<string, "primary" | "warning" | "muted" | "success"> = {
  discovery: "primary",
  demo: "warning",
  "follow-up": "muted",
  closing: "success",
};

export function MeetingsView() {
  const { meetings } = useAppStore();

  const upcoming = useMemo(() => meetings.slice(0, 8), [meetings]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-primary" />
              <h3 className="text-sm font-semibold">Votre lien de booking</h3>
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
                unique
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Partagez ce lien à vos prospects pour qu'ils réservent un créneau.
            </p>
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] md:text-xs">
                leadcortex.io/book/utilisateur
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText("https://leadcortex.io/book/utilisateur");
                  toast.success("Lien copié");
                }}
                className="shrink-0 rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Copier
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Prochains rendez-vous</h3>
          <span className="text-[10px] text-muted-foreground">
            {upcoming.length} à venir
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/20 p-8 text-center">
            <CalendarDays className="mx-auto size-6 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Aucun meeting planifié.
            </p>
            <button
              type="button"
              onClick={() => toast.info("Partagez votre lien de booking à un prospect.")}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[11px] font-medium hover:bg-surface"
            >
              <Plus className="size-3.5" /> Planifier
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
              >
                <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-primary">
                    {m.date}
                  </span>
                  <span className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                    {m.time}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{m.title}</span>
                    <Badge tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type]}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {m.with} · {m.company}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {m.duration}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Ouverture du lien de visio…")}
                  className="shrink-0 inline-flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2 text-[10px] font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  <Video className="size-3" />
                  Rejoindre
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
