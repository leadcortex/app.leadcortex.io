//frontend\lib\enrichment-api.ts
import {
  DEFAULT_CREDITS_TOTAL,
  DEFAULT_CREDITS_USED,
  DEFAULT_JOBS,
  DEFAULT_PROVIDERS,
  type EnrichmentJob,
  type EnrichmentProvider,
} from "./enrichment-mock";

const FAKE_LATENCY = 180;
const wait = <T>(value: T, ms = FAKE_LATENCY) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export async function fetchProviders(): Promise<EnrichmentProvider[]> {
  return wait(DEFAULT_PROVIDERS.map((p) => ({ ...p })));
}

export async function updateProviderApi(
  id: string,
  patch: Partial<EnrichmentProvider>,
): Promise<EnrichmentProvider> {
  const current = DEFAULT_PROVIDERS.find((p) => p.id === id);
  if (!current) throw new Error(`Provider ${id} introuvable`);
  return wait({ ...current, ...patch });
}

export async function reorderProvidersApi(orderedIds: string[]): Promise<void> {
  // BACKEND: POST /api/enrichment/providers/reorder { ids: orderedIds }
  return wait(undefined);
}

/* ─── Jobs ───────────────────────────────────────────────────────────────── */

export async function fetchJobs(params?: {
  range?: "7j" | "30j" | "90j";
  status?: "success" | "failed" | "skipped" | "all";
}): Promise<EnrichmentJob[]> {
  // BACKEND: GET /api/enrichment/jobs?range=...&status=...
  const range = params?.range ?? "30j";
  const maxAgeH = range === "7j" ? 24 * 7 : range === "30j" ? 24 * 30 : 24 * 90;
  const cutoff = Date.now() - maxAgeH * 3600_000;
  const filtered = DEFAULT_JOBS.filter((j) => new Date(j.timestamp).getTime() >= cutoff);
  const byStatus =
    params?.status && params.status !== "all"
      ? filtered.filter((j) => j.status === params.status)
      : filtered;
  return wait(byStatus.map((j) => ({ ...j })));
}

/* ─── Wallet ─────────────────────────────────────────────────────────────── */

export async function fetchWallet(): Promise<{ total: number; used: number }> {
  // BACKEND: GET /api/enrichment/wallet
  return wait({ total: DEFAULT_CREDITS_TOTAL, used: DEFAULT_CREDITS_USED });
}

export async function rechargeCreditsApi(amount: number): Promise<{ total: number }> {
  // BACKEND: POST /api/enrichment/wallet/recharge { amount }
  return wait({ total: DEFAULT_CREDITS_TOTAL + amount });
}
