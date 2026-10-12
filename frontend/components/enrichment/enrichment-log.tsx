//frontend\components\enrichment\enrichment-log.tsx
import { CheckCircle2, CircleSlash, XCircle } from "lucide-react";
import { Badge } from "@/components/ui-primitives";
import type { EnrichmentJob } from "@/lib/enrichment-mock";
import { cn } from "@/lib/utils";
import { ProviderBadge } from "./provider-badge";

const STATUS = {
  success: { tone: "success" as const, label: "Succès", icon: CheckCircle2 },
  failed: { tone: "destructive" as const, label: "Échec", icon: XCircle },
  skipped: { tone: "muted" as const, label: "Ignoré", icon: CircleSlash },
};

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

export function EnrichmentLog({
  jobs,
  emptyLabel = "Aucun enrichissement sur la période.",
}: {
  jobs: EnrichmentJob[];
  emptyLabel?: string;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
      {jobs.map((job) => {
        const st = STATUS[job.status];
        const Icon = st.icon;
        return (
          <li
            key={job.id}
            className="grid items-center gap-3 px-3 py-2.5 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)_auto_auto] md:px-4"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium md:text-sm">{job.leadName}</p>
              <p className="truncate text-[10px] text-muted-foreground md:text-[11px]">
                {job.company}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <ProviderBadge slug={job.providerName.toLowerCase()} size={12} ring={false} />
              {job.providerName}
            </span>

            <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground md:text-[11px]">
              {job.field === "full" ? "Fiche complète" : job.field}
            </span>

            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground md:text-[11px]">
              <Icon
                className={cn(
                  "size-3.5",
                  job.status === "success" && "text-emerald-500",
                  job.status === "failed" && "text-destructive",
                )}
              />
              {st.label}
            </span>

            <span className="text-right text-[10px] text-muted-foreground md:text-[11px]">
              {relative(job.timestamp)}
              {job.cost > 0 && (
                <Badge tone="muted" className="ml-2">
                  -{job.cost}
                </Badge>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
