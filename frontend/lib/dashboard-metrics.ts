//frontend\lib\dashboard-metrics.ts
import {
  analyticsSeries,
  calls as demoCalls,
  conversations as demoConversations,
  deals as demoDeals,
  emails as demoEmails,
  leads as demoLeads,
  meetings as demoMeetings,
  sequences as demoSequences,
  tasks as demoTasks,
  visitors as demoVisitors,
  workflows as demoWorkflows,
  type CallItem,
  type Conversation,
  type Deal,
  type Email,
  type Lead,
  type Meeting,
  type Task,
  type Visitor,
  type Workflow,
} from "./mock-data";

type Sequence = { id: string; name: string; status: "active" | "paused"; leads: number };

export type MetricsSource = {
  leads: Lead[];
  tasks: Task[];
  deals: Deal[];
  emails: Email[];
  meetings: Meeting[];
  workflows: Workflow[];
  conversations: Conversation[];
  calls: CallItem[];
  visitors: Visitor[];
  sequences: Sequence[];
};

function pick<T>(live: T[] | undefined, demo: T[]): T[] {
  return live && live.length > 0 ? live : demo;
}

export function resolveSource(state: Partial<MetricsSource>): MetricsSource {
  return {
    leads: pick(state.leads, demoLeads),
    tasks: pick(state.tasks, demoTasks),
    deals: pick(state.deals, demoDeals),
    emails: pick(state.emails, demoEmails),
    meetings: pick(state.meetings, demoMeetings),
    workflows: pick(state.workflows, demoWorkflows),
    conversations: pick(state.conversations, demoConversations),
    calls: pick(state.calls, demoCalls),
    visitors: pick(state.visitors, demoVisitors),
    sequences: pick(state.sequences as Sequence[] | undefined, demoSequences as Sequence[]),
  };
}

export const STAGE_LABELS: Record<Deal["stage"], string> = {
  qualified: "Qualifié",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  lost: "Perdu",
};

const STAGE_ORDER: Deal["stage"][] = ["qualified", "proposal", "negotiation", "won", "lost"];

/** Répartition du pipeline par étape (donut). */
export function pipelineByStage(deals: Deal[]) {
  return STAGE_ORDER.map((stage) => {
    const rows = deals.filter((d) => d.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: rows.length,
      amount: rows.reduce((n, d) => n + d.amount, 0),
    };
  }).filter((s) => s.count > 0);
}

export function funnelSteps(src: MetricsSource) {
  const contacted = src.emails.length + src.calls.length;
  const replied = src.emails.filter((e) => e.status === "replied").length;
  const meetings = src.meetings.length;
  const won = src.deals.filter((d) => d.stage === "won").length;

  return [
    { step: "Leads", value: src.leads.length },
    { step: "Contactés", value: contacted },
    { step: "Réponses", value: replied },
    { step: "RDV", value: meetings },
    { step: "Gagnés", value: won },
  ];
}

export function volumeSeries(range: "7j" | "30j" | "90j") {
  if (range === "7j") {
    return analyticsSeries.map((d) => ({
      label: `${d.day}`,
      leads: d.leads,
      replies: d.replies,
      enriched: Math.round(d.leads * 0.86),
      meetings: Math.max(1, Math.round(d.replies * 0.42)),
    }));
  }

  const buckets = range === "30j" ? 6 : 9;
  const step = range === "30j" ? 5 : 10;
  return Array.from({ length: buckets }, (_, i) => {
    const base = analyticsSeries[i % analyticsSeries.length];
    const growth = 1 + i * 0.12;
    const leads = Math.round(base.leads * step * 0.6 * growth);
    const replies = Math.round(base.replies * step * 0.6 * growth);
    return {
      label: `S${i + 1}`,
      leads,
      replies,
      enriched: Math.round(leads * 0.84),
      meetings: Math.max(1, Math.round(replies * 0.4)),
    };
  });
}

/** Exécutions de workflows par jour (aire empilée : réussies / en erreur). */
export function workflowRunsSeries(workflows: Workflow[]) {
  const totalRuns = workflows.reduce((n, w) => n + w.runs, 0) || 240;
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weights = [0.16, 0.19, 0.14, 0.21, 0.18, 0.07, 0.05];

  return days.map((day, i) => {
    const runs = Math.round(totalRuns * weights[i]);
    const failed = Math.max(0, Math.round(runs * (i === 3 ? 0.09 : 0.035)));
    return { day, success: runs - failed, failed };
  });
}

/** Santé des automatisations : actifs / brouillons / en pause. */
export function workflowStatusBreakdown(workflows: Workflow[]) {
  const counts = { active: 0, draft: 0, paused: 0 } as Record<Workflow["status"], number>;
  workflows.forEach((w) => {
    counts[w.status] = (counts[w.status] ?? 0) + 1;
  });
  return [
    { label: "Actifs", value: counts.active },
    { label: "Brouillons", value: counts.draft },
    { label: "En pause", value: counts.paused },
  ].filter((r) => r.value > 0);
}

/** Top automatisations par nombre d'exécutions. */
export function topWorkflows(workflows: Workflow[], limit = 5) {
  return [...workflows]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, limit)
    .map((w) => ({ name: w.name, runs: w.runs, actions: w.actions, status: w.status, id: w.id }));
}

/** Mix des canaux d'engagement (radar / bar). */
export function channelMix(src: MetricsSource) {
  return [
    { channel: "Email", value: src.emails.length },
    { channel: "Appels", value: src.calls.length },
    {
      channel: "LinkedIn",
      value: src.conversations.filter((c) => c.channel === "linkedin").length,
    },
    { channel: "Web", value: src.visitors.length },
    { channel: "RDV", value: src.meetings.length },
  ];
}

/** Statuts d'emails (bar empilé horizontal). */
export function emailOutcomes(emails: Email[]) {
  const order: Email["status"][] = ["sent", "opened", "replied", "bounced"];
  const labels: Record<Email["status"], string> = {
    sent: "Envoyés",
    opened: "Ouverts",
    replied: "Répondus",
    bounced: "Rejetés",
  };
  return order.map((s) => ({
    label: labels[s],
    value: emails.filter((e) => e.status === s).length,
  }));
}

/** Intention des visiteurs identifiés. */
export function visitorIntent(visitors: Visitor[]) {
  const labels: Record<Visitor["intent"], string> = { hot: "Chaud", warm: "Tiède", cold: "Froid" };
  return (["hot", "warm", "cold"] as Visitor["intent"][])
    .map((k) => ({ label: labels[k], value: visitors.filter((v) => v.intent === k).length }))
    .filter((r) => r.value > 0);
}

/** Signaux d'achat détectés (barres horizontales). */
export const buyingSignals = [
  { label: "Levée de fonds", value: 42 },
  { label: "Recrutement", value: 31 },
  { label: "Nouveau produit", value: 18 },
  { label: "Changement de CTO", value: 12 },
  { label: "Expansion géo.", value: 9 },
];

export function formatEuro(amount: number) {
  return `${Math.round(amount).toLocaleString("fr-FR")} €`;
}

export function formatCompactEuro(amount: number) {
  if (amount >= 1000) return `${Math.round(amount / 1000)} K€`;
  return `${amount} €`;
}
