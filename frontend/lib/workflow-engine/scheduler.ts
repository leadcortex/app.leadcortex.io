//frontend\lib\workflow-engine\scheduler.ts
export type ScheduledJobKind = "resume-run" | "recurring-trigger";

export type ScheduledJob = {
  jobId: string;
  kind: ScheduledJobKind;
  runId?: string;
  workflowId?: string;
  runAt: number;
  payload: Record<string, unknown>;
  attempts: number;
  leaseUntil: number | null;
};

export type JobRunner = (job: ScheduledJob) => Promise<void>;

let jobCounter = 0;

export class Scheduler {
  private readonly jobs = new Map<string, ScheduledJob>();
  private runner: JobRunner | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly leaseMs = 60_000;

  setRunner(runner: JobRunner): void {
    this.runner = runner;
  }

  schedule(input: {
    kind: ScheduledJobKind;
    runAt: number | string;
    runId?: string;
    workflowId?: string;
    payload?: Record<string, unknown>;
  }): ScheduledJob {
    jobCounter += 1;
    const runAt = typeof input.runAt === "string" ? Date.parse(input.runAt) : input.runAt;
    const job: ScheduledJob = {
      jobId: `job_${Date.now().toString(36)}_${jobCounter}`,
      kind: input.kind,
      runAt: Number.isFinite(runAt) ? runAt : Date.now(),
      payload: input.payload ?? {},
      attempts: 0,
      leaseUntil: null,
    };
    if (input.runId !== undefined) job.runId = input.runId;
    if (input.workflowId !== undefined) job.workflowId = input.workflowId;
    this.jobs.set(job.jobId, job);
    this.ensureTicking();
    return job;
  }

  cancelForRun(runId: string): number {
    let removed = 0;
    for (const [jobId, job] of this.jobs) {
      if (job.runId === runId) {
        this.jobs.delete(jobId);
        removed += 1;
      }
    }
    return removed;
  }

  list(): ScheduledJob[] {
    return [...this.jobs.values()].sort((a, b) => a.runAt - b.runAt);
  }

  /** Prend un lease sur les jobs échus et les exécute. Idempotent. */
  async processDueJobs(now = Date.now()): Promise<number> {
    const runner = this.runner;
    if (!runner) return 0;
    const due = [...this.jobs.values()].filter(
      (job) => job.runAt <= now && (job.leaseUntil === null || job.leaseUntil < now),
    );
    let processed = 0;
    for (const job of due) {
      job.leaseUntil = now + this.leaseMs;
      job.attempts += 1;
      try {
        await runner(job);
        this.jobs.delete(job.jobId);
        processed += 1;
      } catch {
        job.leaseUntil = null;
        // Backoff simple : on repousse le job, il sera rejoué au prochain tick.
        job.runAt = now + Math.min(60_000, 1000 * 2 ** Math.min(job.attempts, 5));
        if (job.attempts > 8) this.jobs.delete(job.jobId);
      }
    }
    if (this.jobs.size === 0) this.stopTicking();
    return processed;
  }

  private ensureTicking(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      void this.processDueJobs();
    }, 1000);
    // Ne bloque pas la fermeture du process quand l'API le supporte.
    (this.timer as unknown as { unref?: () => void }).unref?.();
  }

  private stopTicking(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}

export const scheduler = new Scheduler();

/* ------------------------------------------------------------------ */
/* Calendrier : cron minimal, jours ouvrés, fuseaux                     */
/* ------------------------------------------------------------------ */

/** Convertit une durée `{value, unit}` en millisecondes. */
export function durationToMs(value: number, unit: string): number {
  const factors: Record<string, number> = {
    ms: 1,
    seconds: 1000,
    minutes: 60_000,
    hours: 3_600_000,
    days: 86_400_000,
    weeks: 604_800_000,
  };
  return Math.round(value * (factors[unit] ?? 1000));
}

export type BusinessHours = {
  timezone: string;
  /** 1 = lundi … 7 = dimanche. */
  days: number[];
  startHour: number;
  endHour: number;
  holidays?: string[];
};

/** Renvoie la prochaine date ouvrée à partir de `from` (précision : heure). */
export function nextBusinessTime(from: Date, hours: BusinessHours): Date {
  const cursor = new Date(from.getTime());
  for (let i = 0; i < 24 * 14; i += 1) {
    const parts = zonedParts(cursor, hours.timezone);
    const isHoliday = hours.holidays?.includes(parts.date) ?? false;
    const inDays = hours.days.includes(parts.weekday);
    const inHours = parts.hour >= hours.startHour && parts.hour < hours.endHour;
    if (!isHoliday && inDays && inHours) return cursor;
    cursor.setTime(cursor.getTime() + 3_600_000);
  }
  return cursor;
}

export function zonedParts(
  date: Date,
  timeZone: string,
): {
  date: string;
  hour: number;
  weekday: number;
} {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    date: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    hour: Number(parts["hour"] ?? "0"),
    weekday: weekdayMap[parts["weekday"] ?? "Mon"] ?? 1,
  };
}

/**
 * Cron minimal `minute hour dayOfMonth month dayOfWeek` : valeurs, listes,
 * plages, joker et pas (étoile suivie de slash n).

 * Renvoie la prochaine occurrence UTC après `from`.
 */
export function nextCronOccurrence(expression: string, from = new Date()): Date | null {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const [min, hour, dom, mon, dow] = fields as [string, string, string, string, string];

  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  for (let i = 0; i < 366 * 24 * 60; i += 1) {
    if (
      matchesCronField(min, cursor.getUTCMinutes()) &&
      matchesCronField(hour, cursor.getUTCHours()) &&
      matchesCronField(dom, cursor.getUTCDate()) &&
      matchesCronField(mon, cursor.getUTCMonth() + 1) &&
      matchesCronField(dow, cursor.getUTCDay())
    ) {
      return cursor;
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  return null;
}

function matchesCronField(field: string, value: number): boolean {
  if (field === "*") return true;
  for (const part of field.split(",")) {
    if (part.startsWith("*/")) {
      const step = Number(part.slice(2));
      if (Number.isFinite(step) && step > 0 && value % step === 0) return true;
      continue;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (a !== undefined && b !== undefined && value >= a && value <= b) return true;
      continue;
    }
    if (Number(part) === value) return true;
  }
  return false;
}
