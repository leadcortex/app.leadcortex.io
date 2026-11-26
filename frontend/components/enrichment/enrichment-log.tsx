// frontend/components/enrichment/enrichment-log.tsx

import { CheckCircle2, CircleSlash, XCircle } from "@/components/icons";
import { Badge } from "@/components/common/ui-primitives";
import type { EnrichmentJob } from "@/lib/enrichment/mock";
import { cn } from "@/lib/core/utils";
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
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
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
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)_auto_auto]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{job.leadName}</p>
              <p className="truncate text-xs text-muted-foreground">{job.company}</p>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ProviderBadge slug={job.providerName.toLowerCase()} size={14} ring={false} />
              {job.providerName}
            </span>

            <span className="hidden truncate text-xs text-muted-foreground md:block">
              {job.field === "full" ? "Fiche complète" : job.field}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon
                className={cn(
                  "size-3.5",
                  job.status === "success" && "text-emerald-500",
                  job.status === "failed" && "text-destructive",
                )}
              />
              {st.label}
            </span>

            <span className="text-right text-xs text-muted-foreground tabular-nums">
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
