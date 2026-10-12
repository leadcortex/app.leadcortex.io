//frontend\lib\workflow-engine\logger.ts
import { redactDeep } from "./errors";
import type { EventLevel, EventType, RunEvent } from "./types";

export type EventSink = (event: RunEvent) => void;

export type RunLoggerOptions = {
  runId: string;
  traceId: string;
  sink: EventSink;

  progressThrottleMs?: number;
  maxEventsPerRun?: number;
};

export class RunLogger {
  private seq = 0;
  private emitted = 0;
  private readonly lastProgress = new Map<string, number>();
  private readonly options: Required<RunLoggerOptions>;

  constructor(options: RunLoggerOptions) {
    this.options = {
      progressThrottleMs: options.progressThrottleMs ?? 250,
      maxEventsPerRun: options.maxEventsPerRun ?? 5000,
      ...options,
    };
  }

  emit(
    type: EventType,
    level: EventLevel,
    message: string,
    extra: Partial<Omit<RunEvent, "type" | "level" | "message">> = {},
  ): RunEvent | null {
    if (this.emitted >= this.options.maxEventsPerRun) return null;
    this.emitted += 1;
    this.seq += 1;

    const event: RunEvent = {
      eventId: `evt_${String(this.seq).padStart(5, "0")}`,
      seq: this.seq,
      runId: this.options.runId,
      traceId: this.options.traceId,
      timestamp: new Date().toISOString(),
      level,
      type,
      message,
      sensitive: false,
      ...extra,
    };
    if (extra.data) event.data = redactDeep(extra.data) as Record<string, unknown>;
    this.options.sink(event);
    return event;
  }

  /** Logger restreint exposé aux handlers de bloc. */
  forNode(scope: { nodeId: string; blockId: string; nodeExecutionId: string; attempt: number }) {
    const base = { ...scope };
    const write = (level: EventLevel, message: string, data?: Record<string, unknown>) => {
      this.emit("log", level, message, data ? { ...base, data } : base);
    };
    return {
      debug: (message: string, data?: Record<string, unknown>) => write("debug", message, data),
      info: (message: string, data?: Record<string, unknown>) => write("info", message, data),
      warn: (message: string, data?: Record<string, unknown>) => write("warn", message, data),
      error: (message: string, data?: Record<string, unknown>) => write("error", message, data),
      progress: (processed: number, total: number | null, message?: string) => {
        const now = Date.now();
        const last = this.lastProgress.get(scope.nodeExecutionId) ?? 0;
        const done = total !== null && processed >= total;
        if (!done && now - last < this.options.progressThrottleMs) return;
        this.lastProgress.set(scope.nodeExecutionId, now);
        this.emit("node.progress", "info", message ?? "Progression", {
          ...base,
          data: {
            processed,
            total,
            percent: total && total > 0 ? Math.round((processed / total) * 100) : null,
          },
        });
      },
    };
  }
}

/** Aperçu borné et redacted d'une valeur métier destinée à la console. */
export function previewValue(
  value: unknown,
  maxChars = 600,
): {
  preview: unknown;
  size: number;
  truncated: boolean;
} {
  const redacted = redactDeep(value);
  let serialized = "";
  try {
    serialized = JSON.stringify(redacted) ?? "";
  } catch {
    serialized = "[unserializable]";
  }
  const truncated = serialized.length > maxChars;
  return {
    preview: truncated ? `${serialized.slice(0, maxChars)}…` : redacted,
    size: serialized.length,
    truncated,
  };
}
