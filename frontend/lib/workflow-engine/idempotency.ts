//frontend\lib\workflow-engine\idempotency.ts
export type IdempotencyRecord = {
  key: string;
  createdAt: number;
  expiresAt: number;
  value: unknown;
};

export interface IdempotencyStore {
  get(key: string): IdempotencyRecord | undefined;
  set(key: string, value: unknown, ttlMs: number): IdempotencyRecord;
  delete(key: string): void;
  sweep(now?: number): void;
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  get(key: string): IdempotencyRecord | undefined {
    const record = this.records.get(key);
    if (!record) return undefined;
    if (record.expiresAt <= Date.now()) {
      this.records.delete(key);
      return undefined;
    }
    return record;
  }

  set(key: string, value: unknown, ttlMs: number): IdempotencyRecord {
    const now = Date.now();
    const record: IdempotencyRecord = {
      key,
      createdAt: now,
      expiresAt: now + Math.max(1000, ttlMs),
      value,
    };
    this.records.set(key, record);
    return record;
  }

  delete(key: string): void {
    this.records.delete(key);
  }

  sweep(now = Date.now()): void {
    for (const [key, record] of this.records) {
      if (record.expiresAt <= now) this.records.delete(key);
    }
  }
}

export const idempotencyStore: IdempotencyStore = new MemoryIdempotencyStore();

export function buildIdempotencyKey(parts: (string | number | undefined)[]): string {
  return `idem_${hashString(parts.filter((p) => p !== undefined).join("|"))}`;
}

/** FNV-1a 32 bits — suffisant pour de la déduplication locale, pas pour la crypto. */
export function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Exécute `factory` une seule fois par clé pendant `ttlMs`. */
export async function withIdempotency<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
  store: IdempotencyStore = idempotencyStore,
): Promise<{ value: T; replayed: boolean }> {
  const existing = store.get(key);
  if (existing) return { value: existing.value as T, replayed: true };
  const value = await factory();
  store.set(key, value, ttlMs);
  return { value, replayed: false };
}
