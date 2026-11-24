// frontend/components/enrichment/field-coverage.tsx

import { Building2, Linkedin, Mail, Phone } from "@/components/icons";
import type { EnrichmentProvider } from "@/lib/enrichment/mock";
import { FIELD_LABELS, type EnrichableField, sourcesFor } from "@/lib/enrichment/metrics";
import { CoverageBar } from "@/components/charts/coverage-bar";
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
          <li key={f}>
            <CoverageBar
              icon={<Icon className="size-4" strokeWidth={1.75} />}
              label={FIELD_LABELS[f]}
              value={pct}
              providers={
                sources.length === 0 ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    aucune source
                  </span>
                ) : (
                  <>
                    {sources.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px]"
                        title={`${p.name} · ${p.coverage[f]}%`}
                      >
                        <ProviderBadge slug={p.slug} size={14} ring={false} />
                        <span className="max-w-[80px] truncate">
                          {p.name.split(" ")[0]}
                        </span>
                      </span>
                    ))}
                  </>
                )
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
