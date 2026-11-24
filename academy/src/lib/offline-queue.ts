// academy/src/lib/offline-queue.ts

import { apiFetch } from "./api-client";

const STORAGE_KEY = "academy:offline-queue:v1";
const MAX_QUEUE_SIZE = 200;

export type QueuedEvent = {
  id: string;
  path: string;
  method: "POST" | "PATCH";
  body: unknown;
  learnerId?: string;
  createdAt: string;
  attempts: number;
};

type QueueState = { events: QueuedEvent[] };

function readQueue(): QueueState {
  if (typeof window === "undefined") return { events: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [] };
    const parsed = JSON.parse(raw) as QueueState;
    if (!Array.isArray(parsed?.events)) return { events: [] };
    return parsed;
  } catch {
    return { events: [] };
  }
}

function writeQueue(state: QueueState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

export function newEventId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `evt-${t}-${r}`;
}

export async function sendOrQueue(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  learnerId?: string,
): Promise<void> {
  const event: QueuedEvent = {
    id: newEventId(),
    path,
    method,
    body,
    learnerId,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  try {
    await apiFetch(path, { method, body, learnerId });
    return;
  } catch {
    const q = readQueue();
    q.events.push(event);
    if (q.events.length > MAX_QUEUE_SIZE) {
      q.events = q.events.slice(q.events.length - MAX_QUEUE_SIZE);
    }
    writeQueue(q);
  }
}

export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  const q = readQueue();
  if (q.events.length === 0) return { sent: 0, remaining: 0 };

  const kept: QueuedEvent[] = [];
  let sent = 0;

  for (const ev of q.events) {
    if (ev.attempts >= 10) continue;
    try {
      await apiFetch(ev.path, {
        method: ev.method,
        body: ev.body,
        learnerId: ev.learnerId,
      });
      sent += 1;
    } catch {
      kept.push({ ...ev, attempts: ev.attempts + 1 });
    }
  }

  writeQueue({ events: kept });
  return { sent, remaining: kept.length };
}

let started = false;

export function startQueueAutoFlush(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  void flushQueue();
  window.addEventListener("online", () => {
    void flushQueue();
  });
  window.setInterval(() => {
    void flushQueue();
  }, 60_000);
}

export function queueSize(): number {
  return readQueue().events.length;
}

export function clearQueue(): void {
  writeQueue({ events: [] });
}
