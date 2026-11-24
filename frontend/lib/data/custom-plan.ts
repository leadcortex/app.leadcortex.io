// frontend/lib/data/custom-plan.ts

import { PLANS, type Plan, type PlanId } from "@/lib/data/pricing-strategy";
import { round2 } from "@/lib/payment/order";

export const UNLIMITED = 1_000_000_000;

export const CUSTOM_ANNUAL_DISCOUNT = 0.15;

export const CUSTOM_BASE = {
  label: "Socle LeadCortex",
  detail: "CRM · prospection · BYOK",
  price: 5.99,
} as const;

export type CustomGroupId = "prospection" | "ia" | "equipe" | "extras";

export const CUSTOM_GROUPS: { id: CustomGroupId; label: string }[] = [
  { id: "prospection", label: "Prospection" },
  { id: "ia", label: "IA & automatisation" },
  { id: "equipe", label: "Équipe & accès" },
  { id: "extras", label: "Extras" },
];

export type CustomModuleId =
  | "credits"
  | "tokens"
  | "sessions"
  | "workflow"
  | "signals"
  | "sequences"
  | "messaging"
  | "seats"
  | "workspaces"
  | "api"
  | "support"
  | "academy";

export type CustomOption = {
  value: number;
  label: string;
  price: number;
};

export type CustomModule = {
  id: CustomModuleId;
  label: string;
  hint: string;
  group: CustomGroupId;
  kind: "toggle" | "steps";
  options: CustomOption[];
  defaultIndex: number;
  unit?: string;
  better: "higher" | "lower";
};

const off = (label = "Non"): CustomOption => ({ value: 0, label, price: 0 });

export const CUSTOM_MODULES: CustomModule[] = [
  {
    id: "credits",
    label: "Crédits d'enrichissement",
    hint: "Emails, téléphones et données entreprises retrouvés pour vos leads.",
    group: "prospection",
    kind: "steps",
    unit: "crédits / mois",
    better: "higher",
    defaultIndex: 2,
    options: [
      off("0"),
      { value: 200, label: "200", price: 2.5 },
      { value: 500, label: "500", price: 5.5 },
      { value: 1000, label: "1 000", price: 10 },
      { value: 2500, label: "2 500", price: 22 },
      { value: 5000, label: "5 000", price: 40 },
    ],
  },
  {
    id: "signals",
    label: "Signaux d'intention",
    hint: "Soyez prévenu en temps réel quand un prospect est prêt à acheter.",
    group: "prospection",
    kind: "toggle",
    better: "higher",
    defaultIndex: 0,
    options: [off(), { value: 1, label: "Activé", price: 5 }],
  },
  {
    id: "sequences",
    label: "Séquences & emails",
    hint: "De 1 séquence (200 emails/mois) à l'illimité.",
    group: "prospection",
    kind: "steps",
    better: "higher",
    defaultIndex: 0,
    options: [
      { value: 0, label: "Limitées", price: 0 },
      { value: 1, label: "Illimitées", price: 5 },
    ],
  },
  {
    id: "messaging",
    label: "WhatsApp & Instagram",
    hint: "Prospectez là où vos clients répondent vraiment.",
    group: "prospection",
    kind: "steps",
    unit: "messages / jour",
    better: "higher",
    defaultIndex: 0,
    options: [
      off(),
      { value: 20, label: "20", price: 2 },
      { value: 200, label: "200", price: 5 },
      { value: UNLIMITED, label: "Illimité", price: 12 },
    ],
  },

  {
    id: "tokens",
    label: "Tokens IA inclus",
    hint: "Claude, ChatGPT, Gemini. Vos propres clés (BYOK) restent gratuites.",
    group: "ia",
    kind: "steps",
    unit: "tokens / mois",
    better: "higher",
    defaultIndex: 2,
    options: [
      { value: 0, label: "BYOK", price: 0 },
      { value: 1, label: "1 M", price: 4 },
      { value: 5, label: "5 M", price: 12 },
      { value: 20, label: "20 M", price: 30 },
    ],
  },
  {
    id: "sessions",
    label: "Sessions IA longues",
    hint: "Des conversations avec l'assistant plus longues, sans coupure.",
    group: "ia",
    kind: "toggle",
    better: "higher",
    defaultIndex: 1,
    options: [off(), { value: 1, label: "Activé", price: 5 }],
  },
  {
    id: "workflow",
    label: "Workflow",
    hint: "Automatisez vos parcours sur le canvas visuel.",
    group: "ia",
    kind: "steps",
    unit: "exécutions / mois",
    better: "higher",
    defaultIndex: 1,
    options: [
      off(),
      { value: 100, label: "100", price: 6 },
      { value: 1000, label: "1 000", price: 15 },
      { value: 5000, label: "5 000", price: 34 },
    ],
  },

  {
    id: "seats",
    label: "Utilisateurs",
    hint: "Invitez votre équipe, en édition ou en lecture.",
    group: "equipe",
    kind: "steps",
    unit: "utilisateurs",
    better: "higher",
    defaultIndex: 0,
    options: [
      { value: 1, label: "1", price: 0 },
      { value: 2, label: "2", price: 6 },
      { value: 3, label: "3", price: 11.5 },
      { value: 5, label: "5", price: 21 },
      { value: 10, label: "10", price: 40 },
    ],
  },
  {
    id: "workspaces",
    label: "Multi-workspaces",
    hint: "Séparez vos clients ou vos marques en espaces distincts.",
    group: "equipe",
    kind: "toggle",
    better: "higher",
    defaultIndex: 0,
    options: [off(), { value: 1, label: "Activé", price: 7 }],
  },
  {
    id: "api",
    label: "Accès API",
    hint: "Branchez LeadCortex à vos propres outils.",
    group: "equipe",
    kind: "toggle",
    better: "higher",
    defaultIndex: 0,
    options: [off(), { value: 1, label: "Activé", price: 9 }],
  },
  {
    id: "support",
    label: "Support",
    hint: "Le délai de réponse de notre équipe.",
    group: "equipe",
    kind: "steps",
    unit: "de délai",
    better: "lower",
    defaultIndex: 0,
    options: [
      { value: 48, label: "48 h", price: 0 },
      { value: 24, label: "24 h", price: 3 },
      { value: 4, label: "4 h", price: 9 },
    ],
  },

  {
    id: "academy",
    label: "Académie",
    hint: "Parcours de formation et missions pour progresser en prospection.",
    group: "extras",
    kind: "toggle",
    better: "higher",
    defaultIndex: 0,
    options: [off(), { value: 1, label: "Activé", price: 4 }],
  },
];

export type CustomSelection = Record<CustomModuleId, number>;

export function defaultSelection(): CustomSelection {
  return Object.fromEntries(CUSTOM_MODULES.map((m) => [m.id, m.defaultIndex])) as CustomSelection;
}

export function chosenOption(mod: CustomModule, selection: CustomSelection): CustomOption {
  return mod.options[selection[mod.id]] ?? mod.options[0]!;
}

export function customMonthlyPrice(selection: CustomSelection): number {
  const extras = CUSTOM_MODULES.reduce((s, m) => s + chosenOption(m, selection).price, 0);
  return round2(CUSTOM_BASE.price + extras);
}

export function paidModules(selection: CustomSelection): CustomModule[] {
  return CUSTOM_MODULES.filter((m) => chosenOption(m, selection).price > 0);
}

type Caps = Partial<Record<CustomModuleId, number>>;

const PLAN_CAPS: Record<PlanId, Caps> = {
  starter: {
    credits: 200,
    seats: 1,
    tokens: 1,
    sessions: 0,
    workflow: 0,
    signals: 0,
    sequences: 0,
    messaging: 20,
    workspaces: 0,
    api: 0,
    support: 48,
  },
  founder: {
    credits: 1000,
    seats: 2,
    tokens: UNLIMITED,
    sessions: 1,
    workflow: 100,
    signals: 1,
    sequences: 1,
    messaging: 200,
    workspaces: 0,
    api: 0,
    support: 24,
  },
  studio: {
    credits: 5000,
    seats: 5,
    tokens: UNLIMITED,
    sessions: 1,
    workflow: 1000,
    signals: 1,
    sequences: 1,
    messaging: UNLIMITED,
    workspaces: 1,
    api: 1,
    support: 4,
  },
};

function planCovers(plan: Plan, selection: CustomSelection): boolean {
  const caps = PLAN_CAPS[plan.id];
  return CUSTOM_MODULES.every((m) => {
    const chosen = chosenOption(m, selection);
    const cap = caps[m.id];
    if (m.better === "lower") return cap !== undefined && cap <= chosen.value;
    if (chosen.value === 0) return true;
    return cap !== undefined && cap >= chosen.value;
  });
}

export function cheapestCoveringPlan(selection: CustomSelection): Plan | null {
  const sorted = [...PLANS].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  return sorted.find((p) => planCovers(p, selection)) ?? null;
}
