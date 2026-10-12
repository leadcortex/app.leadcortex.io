//frontend\lib\security\rate-limit.ts
type Attempt = { at: number; success: boolean };

type Bucket = {
  attempts: Attempt[];
  failures: number;
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;
const PRUNE_INTERVAL_MS = 60_000;
let lastPrune = 0;

function prune(now: number, windowMs: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, b] of buckets) {
    b.attempts = b.attempts.filter((a) => now - a.at < windowMs);
    if (b.attempts.length === 0 && b.blockedUntil < now) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS;
    const keys = Array.from(buckets.keys()).slice(0, excess);
    for (const k of keys) buckets.delete(k);
  }
}

export type RateLimitConfig = {
  windowMs: number;
  max: number;
  blockMs: number;
  maxFailuresBeforeBlock: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
};

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  prune(now, config.windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { attempts: [], failures: 0, blockedUntil: 0 };
    buckets.set(key, bucket);
  }

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterMs: bucket.blockedUntil - now,
      remaining: 0,
    };
  }

  bucket.attempts = bucket.attempts.filter((a) => now - a.at < config.windowMs);

  if (bucket.attempts.length >= config.max) {
    const oldest = bucket.attempts[0].at;
    return {
      allowed: false,
      retryAfterMs: config.windowMs - (now - oldest),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: config.max - bucket.attempts.length,
  };
}

export function recordAttempt(key: string, success: boolean, config: RateLimitConfig) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { attempts: [], failures: 0, blockedUntil: 0 };
    buckets.set(key, bucket);
  }

  bucket.attempts.push({ at: now, success });

  if (success) {
    bucket.failures = 0;
    bucket.blockedUntil = 0;
    bucket.attempts = [];
  } else {
    bucket.failures += 1;
    if (bucket.failures >= config.maxFailuresBeforeBlock) {
      const extra = Math.min(bucket.failures - config.maxFailuresBeforeBlock, 3);
      const block = config.blockMs * Math.pow(2, extra);
      bucket.blockedUntil = now + block;
    }
  }
}

export function getClientIp(request: Request): string {
  const h = request.headers;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = h.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}
