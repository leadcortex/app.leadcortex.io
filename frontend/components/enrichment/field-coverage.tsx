//frontend\components\enrichment\field-coverage.tsx
import { Building2, Linkedin, Mail, Phone } from "lucide-react";
import type { EnrichmentProvider } from "@/lib/enrichment-mock";
import { FIELD_LABELS, type EnrichableField, sourcesFor } from "@/lib/enrichment-metrics";
import { cn } from "@/lib/utils";
import { ProviderBadge } from "./provider-badge";

const FIELDS: EnrichableField[] = ["email", "phone", "linkedin", "company"];

const ICONS: Record<EnrichableField, typeof Mail> = {
  email: Mail,
  phone: Phone,
  linkedin: Linkedin,
  company: Building2,
};

export function FieldCoverage({
  providers,
  coverage,
}: {
  providers: EnrichmentProvider[];
  coverage: Record<EnrichableField, number>;
}) {
  return (
    <ul className="space-y-3">
      {FIELDS.map((f) => {
        const Icon = ICONS[f];
        const pct = coverage[f];
        const sources = sourcesFor(providers, f);
        return (
          <li
            key={f}
            className="grid items-center gap-3 rounded-xl border border-border/70 bg-surface/20 p-3 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)_auto] md:p-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-background text-muted-foreground">
                <Icon className="size-3.5" strokeWidth={1.75} />
              </span>
              <span className="truncate text-xs font-medium md:text-sm">{FIELD_LABELS[f]}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    pct >= 85 ? "bg-emerald-500" : pct >= 60 ? "bg-primary" : "bg-amber-500",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums">
                {pct}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {sources.length === 0 ? (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  aucune source active
                </span>
              ) : (
                sources.slice(0, 3).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px]"
                    title={`${p.name} · ${p.coverage[f]}%`}
                  >
                    <ProviderBadge slug={p.slug} size={14} ring={false} />
                    <span className="max-w-[80px] truncate">{p.name.split(" ")[0]}</span>
                  </span>
                ))
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
