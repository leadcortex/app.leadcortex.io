//frontend\lib\enrichment-metrics.ts
import type { EnrichableField, EnrichmentJob, EnrichmentProvider } from "./enrichment-mock";

export type { EnrichableField };

const FIELDS: EnrichableField[] = ["email", "phone", "linkedin", "company"];

export function aggregateCoverage(
  providers: EnrichmentProvider[],
): Record<EnrichableField, number> {
  const active = providers.filter((p) => p.status === "connected");
  const out = { email: 0, phone: 0, linkedin: 0, company: 0 } as Record<EnrichableField, number>;
  for (const f of FIELDS) {
    out[f] = active.reduce((m, p) => Math.max(m, p.coverage[f] ?? 0), 0);
  }
  return out;
}

export function sourcesFor(
  providers: EnrichmentProvider[],
  field: EnrichableField,
): EnrichmentProvider[] {
  return providers
    .filter((p) => p.status === "connected" && p.supports.includes(field))
    .sort((a, b) => b.coverage[field] - a.coverage[field]);
}

export type EnrichmentKpis = {
  totalJobs: number;
  successCount: number;
  failedCount: number;
  matchRate: number;
  totalCredits: number;
  costPerMatch: number;
  waterfallEfficiency: number;
};

export function aggregateKpis(
  providers: EnrichmentProvider[],
  jobs: EnrichmentJob[],
): EnrichmentKpis {
  const active = providers
    .filter((p) => p.status === "connected")
    .sort((a, b) => a.priority - b.priority);
  const firstId = active[0]?.id;

  const totalJobs = jobs.length;
  const successCount = jobs.filter((j) => j.status === "success").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const totalCredits = jobs.reduce((n, j) => n + j.cost, 0);
  const firstSuccess = firstId
    ? jobs.filter((j) => j.status === "success" && j.providerId === firstId).length
    : 0;

  return {
    totalJobs,
    successCount,
    failedCount,
    matchRate: totalJobs ? (successCount / totalJobs) * 100 : 0,
    totalCredits,
    costPerMatch: successCount ? totalCredits / successCount : 0,
    waterfallEfficiency: successCount ? (firstSuccess / successCount) * 100 : 0,
  };
}

export const FIELD_LABELS: Record<EnrichableField, string> = {
  email: "Email professionnel",
  phone: "Téléphone direct",
  linkedin: "LinkedIn",
  company: "Firmographique",
};

export const FIELD_ICON_KEY: Record<EnrichableField, string> = {
  email: "mail",
  phone: "phone",
  linkedin: "linkedin",
  company: "building",
};
