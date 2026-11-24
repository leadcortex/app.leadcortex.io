// frontend/components/hub/calls-view.tsx

import { useMemo, useState } from "react";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PlayCircle,
  Voicemail,
} from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { Badge } from "@/components/common/ui-primitives";
import { cn } from "@/lib/core/utils";

export function CallsView() {
  const { calls } = useAppStore();
  const [filter, setFilter] = useState<"all" | "outbound" | "inbound">("all");

  const visible = useMemo(() => {
    if (filter === "all") return calls;
    return calls.filter((c) => c.direction === filter);
  }, [calls, filter]);

  const stats = useMemo(() => {
    const connected = calls.filter((c) => c.outcome === "connected").length;
    const booked = calls.filter((c) => c.outcome === "meeting-booked").length;
    const rate = calls.length > 0 ? Math.round((connected / calls.length) * 100) : 0;
    return { total: calls.length, connected, booked, rate };
  }, [calls]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <MiniStat label="Appels" value={String(stats.total)} />
        <MiniStat label="Connectés" value={String(stats.connected)} />
        <MiniStat label="Taux" value={`${stats.rate}%`} tone="primary" />
        <MiniStat label="RDV bookés" value={String(stats.booked)} tone="success" />
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface/40 p-0.5">
        {(
          [
            { key: "all", label: "Tous" },
            { key: "outbound", label: "Sortants" },
            { key: "inbound", label: "Entrants" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              filter === f.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/20 p-8 text-center">
          <Phone className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Aucun appel dans cet historique.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((call) => {
            const directionIcon =
              call.outcome === "voicemail"
                ? Voicemail
                : call.outcome === "no-answer"
                  ? PhoneMissed
                  : call.direction === "inbound"
                    ? PhoneIncoming
                    : PhoneOutgoing;
            const DirectionIcon = directionIcon;
            const outcomeLabel: Record<typeof call.outcome, string> = {
              connected: "Connecté",
              voicemail: "Messagerie",
              "no-answer": "Sans réponse",
              "meeting-booked": "RDV booké",
            };
            const outcomeTone: Record<
              typeof call.outcome,
              "primary" | "success" | "muted" | "warning"
            > = {
              connected: "primary",
              voicemail: "muted",
              "no-answer": "muted",
              "meeting-booked": "success",
            };
            return (
              <li
                key={call.id}
                className="group flex items-start gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
              >
                <LetterAvatar name={call.contact} size={40} shape="circle" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{call.contact}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        call.direction === "inbound"
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <DirectionIcon className="size-2.5" />
                      {call.direction === "inbound" ? "Entrant" : "Sortant"}
                    </span>
                    <Badge tone={outcomeTone[call.outcome]}>
                      {outcomeLabel[call.outcome]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {call.company} · {call.duration} · {call.time}
                  </p>
                </div>
                {call.duration !== "0:00" && (
                  <button
                    type="button"
                    onClick={() => toast.info("Lecture de l'enregistrement…")}
                    className="shrink-0 inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] text-primary transition-colors hover:bg-surface"
                  >
                    <PlayCircle className="size-3" />
                    Écouter
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "primary" | "success";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 md:px-4 md:py-3">
      <p className={cn("font-display text-xl italic leading-none tabular-nums md:text-2xl", color)}>
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
