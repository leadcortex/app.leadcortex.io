// frontend/lib/analytics/dashboard-metrics-people.ts

import type { Lead, Task, Meeting } from "../data/mock-data";

export type PipelineStats = {
  total: number;
  active: number;
  enriched: number;
  hot: number;
  replied: number;
  won: number;
  lost: number;
  enrichedPct: number;
  hotPct: number;
  replyRate: number;
};

export type StageSegment = {
  stage: "new" | "contacted" | "replied" | "meeting" | "won" | "lost";
  label: string;
  count: number;
  pct: number;
};

export type SignalGroup = {
  signal: string;
  count: number;
  leads: Lead[];
};

export function computePipelineStats(leads: Lead[]): PipelineStats {
  const total = leads.length;
  const active = leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
  const enriched = leads.filter((l) => Boolean(l.email) && Boolean(l.phone)).length;
  const hot = leads.filter((l) => (l.score ?? 0) >= 8).length;
  const replied = leads.filter(
    (l) => l.stage === "replied" || l.stage === "meeting" || l.stage === "won",
  ).length;
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;

  const contacted = leads.filter(
    (l) =>
      l.stage === "contacted" ||
      l.stage === "replied" ||
      l.stage === "meeting" ||
      l.stage === "won",
  ).length;

  return {
    total,
    active,
    enriched,
    hot,
    replied,
    won,
    lost,
    enrichedPct: total > 0 ? Math.round((enriched / total) * 100) : 0,
    hotPct: total > 0 ? Math.round((hot / total) * 100) : 0,
    replyRate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
  };
}

const STAGE_LABEL: Record<StageSegment["stage"], string> = {
  new: "Nouveau",
  contacted: "Contacté",
  replied: "Répondu",
  meeting: "RDV",
  won: "Gagné",
  lost: "Perdu",
};

const STAGE_ORDER: StageSegment["stage"][] = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "won",
  "lost",
];

export function getStageBreakdown(leads: Lead[]): StageSegment[] {
  const total = leads.length;
  if (total === 0) return [];
  const counts: Record<string, number> = {};
  for (const l of leads) {
    const st = (l.stage ?? "new") as StageSegment["stage"];
    counts[st] = (counts[st] ?? 0) + 1;
  }
  return STAGE_ORDER.filter((st) => counts[st] !== undefined).map((st) => ({
    stage: st,
    label: STAGE_LABEL[st],
    count: counts[st] ?? 0,
    pct: Math.round(((counts[st] ?? 0) / total) * 100),
  }));
}

export function getTopPriorityLeads(leads: Lead[], limit = 5): Lead[] {
  return [...leads]
    .filter((l) => l.stage !== "won" && l.stage !== "lost")
    .filter((l) => (l.score ?? 0) >= 7 || Boolean(l.signal))
    .sort((a, b) => {
      const sa = a.score ?? 0;
      const sb = b.score ?? 0;
      if (sb !== sa) return sb - sa;
      const sigA = a.signal ? 1 : 0;
      const sigB = b.signal ? 1 : 0;
      if (sigB !== sigA) return sigB - sigA;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function getRecentLeads(leads: Lead[], limit = 5): Lead[] {
  return leads
    .filter((l) => Boolean(l.email) || typeof l.score === "number")
    .slice(0, limit);
}

export function getHotSignals(leads: Lead[], limit = 5): SignalGroup[] {
  const map = new Map<string, Lead[]>();
  for (const l of leads) {
    if (!l.signal) continue;
    if (l.stage === "won" || l.stage === "lost") continue;
    const arr = map.get(l.signal) ?? [];
    arr.push(l);
    map.set(l.signal, arr);
  }
  return Array.from(map.entries())
    .map(([signal, arr]) => ({ signal, count: arr.length, leads: arr }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.done && (t.due === "Aujourd'hui" || t.due === "aujourd'hui"));
}

export function getTodayMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.filter((m) => m.date === "Aujourd'hui" || m.date === "aujourd'hui");
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
