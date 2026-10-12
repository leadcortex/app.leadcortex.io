//frontend\lib\onboarding.ts
import type { Lead, Company, Workflow, Deal } from "./mock-data";
import type { Sequence } from "./store";

export type OnboardingLevel = "empty" | "partial" | "established";

export type OnboardingStepId =
  "add-prospects" | "enrich-contacts" | "create-sequence" | "track-results";

export type OnboardingStepKind = "add" | "enrich" | "sequence" | "track";

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  kind: OnboardingStepKind;

  label: string;

  overview: string;

  description: string;

  href: string;

  cta: string;
};

export type OnboardingStep = OnboardingStepDefinition & {
  index: number;

  done: boolean;
};

export type OnboardingSnapshot = {
  level: OnboardingLevel;
  steps: OnboardingStep[];
  completedCount: number;

  nextStep: OnboardingStep | null;
};

export const ONBOARDING_STEPS: readonly OnboardingStepDefinition[] = [
  {
    id: "add-prospects",
    kind: "add",
    label: "Ajouter des prospects",
    overview: "Trouvez les bonnes entreprises et les bons contacts.",
    description: "Importez vos contacts ou trouvez de nouveaux prospects en quelques clics.",
    href: "/app/people/new",
    cta: "Commencer",
  },
  {
    id: "enrich-contacts",
    kind: "enrich",
    label: "Enrichir vos contacts",
    overview: "Obtenez des informations fiables et à jour.",
    description:
      "Récupérez automatiquement les informations manquantes sur vos prospects et entreprises.",
    href: "/app/enrichment",
    cta: "En savoir plus",
  },
  {
    id: "create-sequence",
    kind: "sequence",
    label: "Créer une séquence",
    overview: "Automatisez vos prises de contact et engagez vos prospects.",
    description: "Lancez des séquences d'emails personnalisées pour engager vos prospects.",
    href: "/app/sequences",
    cta: "En savoir plus",
  },
  {
    id: "track-results",
    kind: "track",
    label: "Suivre vos résultats",
    overview: "Analysez vos performances et convertissez plus.",
    description: "Suivez vos performances en temps réel et optimisez vos campagnes.",
    href: "/app/analytics",
    cta: "Découvrir",
  },
];

export type OnboardingStoreSlice = {
  leads: Lead[];
  companies: Company[];
  sequences: Sequence[];
  workflows: Workflow[];
  deals: Deal[];
};

function hasEnrichedContact(leads: Lead[]): boolean {
  return leads.some((l) => Boolean(l.email) || Boolean(l.phone));
}

function hasActiveWorkflow(workflows: Workflow[]): boolean {
  return workflows.some((w) => w.status === "active" || w.runs > 0);
}

function hasTrackedDeal(deals: Deal[]): boolean {
  return deals.some((d) => d.stage !== "qualified");
}

export function getOnboardingSnapshot(store: OnboardingStoreSlice): OnboardingSnapshot {
  const { leads, companies, sequences, workflows, deals } = store;

  const step1Done = leads.length > 0 || companies.length > 0;

  const step2Done = step1Done && hasEnrichedContact(leads);

  const step3Done = sequences.length > 0;

  const step4Done = hasActiveWorkflow(workflows) || hasTrackedDeal(deals);

  const doneById: Record<OnboardingStepId, boolean> = {
    "add-prospects": step1Done,
    "enrich-contacts": step2Done,
    "create-sequence": step3Done,
    "track-results": step4Done,
  };

  const steps: OnboardingStep[] = ONBOARDING_STEPS.map((def, i) => ({
    ...def,
    index: i + 1,
    done: doneById[def.id],
  }));

  const completedCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done) ?? null;

  const hasAnyBusinessData =
    leads.length > 0 ||
    companies.length > 0 ||
    sequences.length > 0 ||
    workflows.length > 0 ||
    deals.length > 0;

  let level: OnboardingLevel;
  if (!hasAnyBusinessData) level = "empty";
  else if (completedCount === steps.length) level = "established";
  else level = "partial";

  return { level, steps, completedCount, nextStep };
}

export function formatProgress(snapshot: OnboardingSnapshot): string {
  if (snapshot.level === "established") return "Démarrage terminé";
  if (!snapshot.nextStep) return `${snapshot.completedCount} / ${snapshot.steps.length}`;
  return `${snapshot.completedCount} / ${snapshot.steps.length} · ${snapshot.nextStep.label}`;
}
