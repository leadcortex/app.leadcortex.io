// frontend/lib/analytics/dashboard-insights.ts

import type { Lead } from "../data/mock-data";
import {
  channelMix,
  volumeSeries,
  workflowRunsSeries,
  type MetricsSource,
} from "./dashboard-metrics";

export type Tone = "primary" | "success" | "warning" | "destructive";

export type AppPath =
  | "/app/people"
  | "/app/tasks"
  | "/app/workflows"
  | "/app/deals"
  | "/app/emails"
  | "/app/enrichment"
  | "/app/meetings"
  | "/app/analytics";

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: Tone;
  href: AppPath;
  trend?: { values: number[]; delta: number };
  ratio?: number;
};

export function halfDelta(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const half = Math.floor(n / 2);
  const before = values.slice(0, half).reduce((a, b) => a + b, 0);
  const after = values.slice(n - half).reduce((a, b) => a + b, 0);
  if (before === 0) return after > 0 ? 100 : 0;
  return Math.round(((after - before) / before) * 100);
}

export function formatCompactEuroFr(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".", ",")} M€`;
  if (amount >= 1000) return `${Math.round(amount / 1000)} K€`;
  return `${Math.round(amount)} €`;
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export function buildKpis(src: MetricsSource): DashboardKpi[] {
  const series = volumeSeries("7j");
  const leadTrend = series.map((s) => s.leads);
  const replyRateTrend = series.map((s) => (s.leads > 0 ? (s.replies / s.leads) * 100 : 0));

  const open = src.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const openTotal = open.reduce((n, d) => n + d.amount, 0);
  const weighted = open.reduce((n, d) => n + (d.amount * d.probability) / 100, 0);
  const won = src.deals.filter((d) => d.stage === "won");
  const lost = src.deals.filter((d) => d.stage === "lost");
  const winRate = pct(won.length, won.length + lost.length);

  const openTasks = src.tasks.filter((t) => !t.done);
  const highTasks = openTasks.filter((t) => t.priority === "high");

  const activeWf = src.workflows.filter((w) => w.status === "active");
  const runs = workflowRunsSeries(src.workflows);
  const okRuns = runs.reduce((n, r) => n + r.success, 0);
  const allRuns = runs.reduce((n, r) => n + r.success + r.failed, 0);

  const enriched = src.leads.filter((l) => Boolean(l.email) && Boolean(l.phone)).length;
  const replyRate = Math.round(replyRateTrend.reduce((a, b) => a + b, 0) / replyRateTrend.length);

  return [
    {
      id: "leads",
      label: "Prospects",
      value: src.leads.length.toLocaleString("fr-FR"),
      hint: `${pct(enriched, src.leads.length)} % enrichis`,
      tone: "primary",
      href: "/app/people",
      trend: { values: leadTrend, delta: halfDelta(leadTrend) },
    },
    {
      id: "reply-rate",
      label: "Taux de réponse",
      value: `${replyRate} %`,
      hint: "moyenne sur 7 jours",
      tone: "success",
      href: "/app/emails",
      trend: { values: replyRateTrend, delta: halfDelta(replyRateTrend) },
    },
    {
      id: "pipeline",
      label: "Pipeline pondéré",
      value: formatCompactEuroFr(weighted),
      hint: `sur ${formatCompactEuroFr(openTotal)} · ${open.length} opportunités`,
      tone: "warning",
      href: "/app/deals",
      ratio: pct(weighted, openTotal),
    },
    {
      id: "win-rate",
      label: "Taux de gain",
      value: won.length + lost.length > 0 ? `${winRate} %` : "—",
      hint: `${won.length} gagnée${won.length > 1 ? "s" : ""} · ${lost.length} perdue${lost.length > 1 ? "s" : ""}`,
      tone: "success",
      href: "/app/deals",
      ratio: winRate,
    },
    {
      id: "tasks",
      label: "Tâches ouvertes",
      value: String(openTasks.length),
      hint:
        highTasks.length > 0
          ? `dont ${highTasks.length} prioritaire${highTasks.length > 1 ? "s" : ""}`
          : "aucune urgence",
      tone: highTasks.length > 0 ? "destructive" : "primary",
      href: "/app/tasks",
      ratio: pct(src.tasks.length - openTasks.length, src.tasks.length),
    },
    {
      id: "automations",
      label: "Automatisations",
      value: String(activeWf.length),
      hint: `${pct(okRuns, allRuns)} % de réussite · ${src.workflows.length} au total`,
      tone: "primary",
      href: "/app/workflows",
      ratio: pct(activeWf.length, src.workflows.length),
    },
  ];
}

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
  share: number;
  conversion: number | null;
};

const STAGE_RANK: Record<NonNullable<Lead["stage"]>, number> = {
  new: 0,
  contacted: 1,
  replied: 2,
  meeting: 3,
  won: 4,
  lost: 1,
};

const FUNNEL_LABELS = ["Prospects", "Contactés", "Réponses", "Rendez-vous", "Gagnés"];

export function buildFunnel(leads: Lead[]): FunnelStep[] {
  const reached = FUNNEL_LABELS.map(
    (_, rank) => leads.filter((l) => STAGE_RANK[l.stage ?? "new"] >= rank).length,
  );
  const first = reached[0] || 1;
  return FUNNEL_LABELS.map((label, i) => ({
    key: label,
    label,
    count: reached[i],
    share: Math.round((reached[i] / first) * 100),
    conversion: i === 0 ? null : pct(reached[i], reached[i - 1]),
  }));
}

export type ScoreBucket = { label: string; value: number; hot: boolean };

export function buildScoreBuckets(leads: Lead[]): { buckets: ScoreBucket[]; unscored: number } {
  const labels = ["0–5", "6", "7", "8", "9", "10"];
  const counts = labels.map(() => 0);
  let unscored = 0;
  for (const l of leads) {
    if (typeof l.score !== "number") {
      unscored += 1;
      continue;
    }
    const idx = Math.min(5, Math.max(0, Math.floor(l.score) - 5));
    counts[idx] += 1;
  }
  return {
    buckets: labels.map((label, i) => ({ label, value: counts[i], hot: i >= 3 })),
    unscored,
  };
}

export function buildChannels(src: MetricsSource) {
  return channelMix(src)
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
}

export type Insight = {
  id: string;
  tone: Tone;
  title: string;
  detail: string;
  cta: string;
  href: AppPath;
};

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

export function buildInsights(src: MetricsSource): Insight[] {
  const out: Insight[] = [];

  const hotUncontacted = src.leads.filter(
    (l) => (l.stage ?? "new") === "new" && (l.score ?? 0) >= 8,
  ).length;
  if (hotUncontacted > 0) {
    out.push({
      id: "hot-uncontacted",
      tone: "primary",
      title: `${hotUncontacted} ${plural(hotUncontacted, "prospect chaud", "prospects chauds")} à contacter`,
      detail: "Score de 8 ou plus et aucun premier contact.",
      cta: "Ouvrir les prospects",
      href: "/app/people",
    });
  }

  const highTasks = src.tasks.filter((t) => !t.done && t.priority === "high").length;
  if (highTasks > 0) {
    out.push({
      id: "high-tasks",
      tone: "destructive",
      title: `${highTasks} ${plural(highTasks, "tâche prioritaire", "tâches prioritaires")}`,
      detail: "À traiter avant le reste de la file.",
      cta: "Voir les tâches",
      href: "/app/tasks",
    });
  }

  const bounced = src.emails.filter((e) => e.status === "bounced").length;
  if (bounced > 0) {
    out.push({
      id: "bounced",
      tone: "warning",
      title: `${bounced} ${plural(bounced, "email rejeté", "emails rejetés")}`,
      detail: "Vérifiez les adresses avant la prochaine relance.",
      cta: "Voir les emails",
      href: "/app/emails",
    });
  }

  const paused = src.workflows.filter((w) => w.status === "paused").length;
  if (paused > 0) {
    out.push({
      id: "paused-workflows",
      tone: "warning",
      title: `${paused} ${plural(paused, "workflow en pause", "workflows en pause")}`,
      detail: "Ces automatisations ne tournent plus.",
      cta: "Gérer les workflows",
      href: "/app/workflows",
    });
  }

  const enrichedPct = pct(
    src.leads.filter((l) => Boolean(l.email) && Boolean(l.phone)).length,
    src.leads.length,
  );
  if (src.leads.length >= 5 && enrichedPct < 60) {
    out.push({
      id: "low-enrichment",
      tone: "warning",
      title: `Enrichissement à ${enrichedPct} %`,
      detail: "Des fiches n'ont ni email ni téléphone.",
      cta: "Lancer l'enrichissement",
      href: "/app/enrichment",
    });
  }

  return out.slice(0, 4);
}

export function workflowHealth(src: MetricsSource) {
  const runs = workflowRunsSeries(src.workflows);
  const ok = runs.reduce((n, r) => n + r.success, 0);
  const failed = runs.reduce((n, r) => n + r.failed, 0);
  return { ok, failed, total: ok + failed, successRate: pct(ok, ok + failed), series: runs };
}
