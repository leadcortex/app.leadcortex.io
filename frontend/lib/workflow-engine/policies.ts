//frontend\lib\workflow-engine\policies.ts
import { WorkflowBlockError } from "./errors";
import type { OnErrorStrategy, ResolvedNodePolicy, RetryPolicy } from "./types";

export const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  factor: 2,
  jitter: true,
};

export const LIMITS = {
  maxNodes: 500,
  maxEdges: 2000,
  maxNodeExecutions: 5000,
  maxRunDurationMs: 10 * 60_000,
  maxPayloadBytes: 1_000_000,
  maxLoopIterations: 10_000,
  maxLoopConcurrency: 20,
  maxHttpBodyBytes: 2_000_000,
  maxTimeoutMs: 120_000,
  defaultTimeoutMs: 30_000,
} as const;

export function resolveNodePolicy(config: Record<string, unknown>): ResolvedNodePolicy {
  const advanced = (config["_advanced"] ?? {}) as Record<string, unknown>;
  const read = (key: string): unknown => advanced[key] ?? config[key];

  const timeoutMs = clampInt(read("timeoutMs"), 1000, LIMITS.maxTimeoutMs, LIMITS.defaultTimeoutMs);
  const retryRaw = (read("retryPolicy") ?? {}) as Record<string, unknown>;
  const retry: RetryPolicy = {
    maxAttempts: clampInt(retryRaw["maxAttempts"], 1, 10, DEFAULT_RETRY.maxAttempts),
    initialDelayMs: clampInt(retryRaw["initialDelayMs"], 0, 60_000, DEFAULT_RETRY.initialDelayMs),
    maxDelayMs: clampInt(retryRaw["maxDelayMs"], 0, 300_000, DEFAULT_RETRY.maxDelayMs),
    factor: clampNumber(retryRaw["factor"], 1, 10, DEFAULT_RETRY.factor),
    jitter: retryRaw["jitter"] === undefined ? DEFAULT_RETRY.jitter : Boolean(retryRaw["jitter"]),
  };

  const onErrorRaw = String(read("onError") ?? "fail");
  const onError: OnErrorStrategy = (["fail", "continue", "branch"] as const).includes(
    onErrorRaw as OnErrorStrategy,
  )
    ? (onErrorRaw as OnErrorStrategy)
    : "fail";

  const policy: ResolvedNodePolicy = {
    timeoutMs,
    retry,
    onError,
    continueOnEmpty: Boolean(read("continueOnEmpty") ?? true),
  };
  const idem = read("idempotencyKey");
  if (typeof idem === "string" && idem.length > 0) policy.idempotencyKey = idem;
  const mapping = read("outputMapping");
  if (mapping && typeof mapping === "object" && !Array.isArray(mapping)) {
    policy.outputMapping = mapping as Record<string, string>;
  }
  return policy;
}

export function backoffDelayMs(policy: RetryPolicy, attempt: number, random = Math.random): number {
  const raw = policy.initialDelayMs * policy.factor ** Math.max(0, attempt - 1);
  const capped = Math.min(raw, policy.maxDelayMs);
  if (!policy.jitter) return Math.round(capped);
  return Math.round(capped * (0.5 + random() * 0.5));
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

const PRIVATE_IPV4 =
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

export type UrlPolicy = {
  allowPrivateNetwork?: boolean;
  allowedHosts?: string[];
  allowedProtocols?: string[];
};

export function assertSafeOutboundUrl(rawUrl: string, policy: UrlPolicy = {}): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new WorkflowBlockError("SSRF_BLOCKED", "URL de destination invalide.", {
      retryable: false,
      details: { rawUrl },
    });
  }

  const protocols = policy.allowedProtocols ?? ["https:", "http:"];
  if (!protocols.includes(url.protocol)) {
    throw new WorkflowBlockError("SSRF_BLOCKED", "Protocole de destination non autorisé.", {
      retryable: false,
      nextAction: "Utilisez une URL https://.",
      details: { protocol: url.protocol },
    });
  }

  const host = url.hostname.toLowerCase();
  if (policy.allowedHosts && policy.allowedHosts.length > 0) {
    const allowed = policy.allowedHosts.some(
      (candidate) =>
        host === candidate.toLowerCase() || host.endsWith(`.${candidate.toLowerCase()}`),
    );
    if (!allowed) {
      throw new WorkflowBlockError("SSRF_BLOCKED", "Hôte de destination non autorisé.", {
        retryable: false,
        details: { host },
      });
    }
  }

  if (!policy.allowPrivateNetwork) {
    if (BLOCKED_HOSTNAMES.has(host) || PRIVATE_IPV4.test(host) || host.endsWith(".internal")) {
      throw new WorkflowBlockError("SSRF_BLOCKED", "Adresse réseau interne interdite.", {
        retryable: false,
        nextAction: "Ciblez une URL publique.",
        details: { host },
      });
    }
  }
  return url;
}

/* ------------------------------------------------------------------ */
/* Rate limit (fenêtre glissante, en mémoire, par fournisseur)         */
/* ------------------------------------------------------------------ */

const buckets = new Map<string, number[]>();

export function tryConsumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): {
  allowed: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  const bucket = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (bucket.length >= limit) {
    const oldest = bucket[0] ?? now;
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }
  bucket.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterMs: 0 };
}

export function assertPayloadSize(value: unknown, maxBytes = LIMITS.maxPayloadBytes): void {
  let size = 0;
  try {
    size = JSON.stringify(value)?.length ?? 0;
  } catch {
    size = 0;
  }
  if (size > maxBytes) {
    throw new WorkflowBlockError("PAYLOAD_TOO_LARGE", "Charge utile trop volumineuse.", {
      retryable: false,
      details: { size, maxBytes },
    });
  }
}
