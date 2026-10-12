//frontend\lib\pricing-strategy.ts
//    CALCULÉES à partir des deux constantes ci-dessous. Ne pas les
//    saisir manuellement pour éviter les incohérences.

export type PlanId = "starter" | "founder" | "studio";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;

  monthlyPrice: number;

  annualDiscount: number;

  annualMonthly: number;

  annualPrice: number;

  annualSavings: number;

  annualDiscountLabel: string;

  credits: number;
  seats: number;

  highlights: string[];

  limitations: string[];

  team: boolean;

  ctaLabel: string;
};

type PlanSeed = Omit<
  Plan,
  "annualMonthly" | "annualPrice" | "annualSavings" | "annualDiscountLabel"
>;

const round2 = (n: number) => Math.round(n * 100) / 100;

const SEEDS: PlanSeed[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Pour valider votre premier canal de prospection.",
    monthlyPrice: 19.99,
    annualDiscount: 0.1,
    credits: 200,
    seats: 1,
    highlights: [
      "200 crédits d'enrichissement/mois",
      "1 utilisateur",
      "Modèles IA inclus (Claude, ChatGPT, Gemini) — usage modéré",
      "1 séquence active · 200 emails/mois",
      "Intégrations de base (Gmail, Outlook)",
      "WhatsApp & Instagram : 20 messages/jour (cumulés)",
    ],
    limitations: [
      "Workflow : indisponible (coûts d'infrastructure)",
      "Signaux d'intention : non inclus",
      "Accès API : non inclus",
      "Support : sous 48h ouvrées",
    ],
    team: false,
    ctaLabel: "Commencer avec Starter",
  },
  {
    id: "founder",
    name: "Founder",
    tagline: "Pour les duos et les premiers objectifs commerciaux.",
    monthlyPrice: 39.99,
    annualDiscount: 0.2,
    credits: 1000,
    seats: 2,
    highlights: [
      "1 000 crédits d'enrichissement/mois",
      "2 utilisateurs (1 siège + 1 invité lecture)",
      "Assistants IA complets · usage illimité en interne",
      "Séquences illimitées · emails illimités",
      "Workflow : inclus (100 exécutions/mois)",
      "Signaux d'intention en temps réel",
      "WhatsApp & Instagram : 200 messages/jour",
      "Support prioritaire sous 24h",
    ],
    limitations: [
      "Accès API : non inclus",
      "WhatsApp/Instagram : plafond 200 msg/jour",
      "Workflow : 100 exécutions/mois",
    ],
    team: true,
    ctaLabel: "Choisir Founder",
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Pour les équipes commerciales qui scalent.",
    monthlyPrice: 70.99,
    annualDiscount: 0.35,
    credits: 5000,
    seats: 5,
    highlights: [
      "5 000 crédits d'enrichissement/mois",
      "5 utilisateurs (rôles édition/lecture)",
      "Assistants IA illimités · tous les fournisseurs (BYOK inclus)",
      "Séquences & emails illimités",
      "Workflow : inclus (1 000 exécutions/mois)",
      "WhatsApp & Instagram : intégration complète illimitée",
      "Accès API complet",
      "Multi-workspaces",
      "Support dédié sous 4h",
    ],
    limitations: [],
    team: true,
    ctaLabel: "Passer à Studio",
  },
];

export const PLANS: Plan[] = SEEDS.map((seed) => {
  const annualMonthly = round2(seed.monthlyPrice * (1 - seed.annualDiscount));
  const annualPrice = round2(annualMonthly * 12);
  const annualSavings = round2(seed.monthlyPrice * 12 - annualPrice);
  return {
    ...seed,
    annualMonthly,
    annualPrice,
    annualSavings,
    annualDiscountLabel: `-${Math.round(seed.annualDiscount * 100)} %`,
  };
});

/* -------------------------------------------------------------------------- */
/*  Récupération d'un plan par id                                             */
/* -------------------------------------------------------------------------- */

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]!;
}

/* -------------------------------------------------------------------------- */
/*  Prix dégressif (fidélité)                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Réduction mensuelle continue pour fidélisation.
 *  • -2 % par mois de fidélité
 *  • Plafonnée à -20 % (atteint à 10 mois)
 *  • Appliquée sur le prix mensuel ou le prix annuel lissé
 *  • Cumulable avec la remise annuelle
 */
export function loyaltyDiscount(monthsSubscribed: number): number {
  const capped = Math.min(monthsSubscribed, 10);
  return Math.min(capped * 0.02, 0.2);
}

export function loyaltyPrice(basePrice: number, monthsSubscribed: number): number {
  const discount = loyaltyDiscount(monthsSubscribed);
  return round2(basePrice * (1 - discount));
}

/** Nombre de mois pour atteindre le plafond fidélité. */
export const LOYALTY_MAX_MONTHS = 10;

/** Libellé prêt à afficher pour le plafond fidélité, ex. "-20 %". */
export const LOYALTY_CAP_LABEL = "-20 %";

/* -------------------------------------------------------------------------- */
/*  Formatage                                                                 */
/* -------------------------------------------------------------------------- */

export function formatEur(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* -------------------------------------------------------------------------- */
/*  Tableau comparatif (vs concurrents)                                       */
/* -------------------------------------------------------------------------- */

export type ComparisonRow = {
  feature: string;
  leadcortex: string;
  apollo: string;
  hunter: string;
  lemlist: string;
  clay: string;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Prix d'entrée (mensuel)",
    leadcortex: "19,99€",
    apollo: "49€/siège",
    hunter: "34€",
    lemlist: "59€",
    clay: "149€",
  },
  {
    feature: "Assistants IA inclus",
    leadcortex: "✓ (Claude, ChatGPT, Gemini)",
    apollo: "✓ (limité)",
    hunter: "✓ (limité)",
    lemlist: "✗",
    clay: "✓ (AI credits)",
  },
  {
    feature: "Workflow visuel",
    leadcortex: "✓ (Founder+)",
    apollo: "✗",
    hunter: "✗",
    lemlist: "✗",
    clay: "✓ (payant)",
  },
  {
    feature: "BYOK (vos clés IA)",
    leadcortex: "✓ Tous les plans",
    apollo: "✗",
    hunter: "✗",
    lemlist: "✗",
    clay: "✗",
  },
  {
    feature: "Prix dégressif fidélité",
    leadcortex: "✓ Jusqu'à -20%",
    apollo: "✗",
    hunter: "✗",
    lemlist: "✗",
    clay: "✗",
  },
  {
    feature: "WhatsApp / Instagram",
    leadcortex: "✓ Intégré",
    apollo: "✗",
    hunter: "✗",
    lemlist: "✓ (add-on)",
    clay: "✗",
  },
  {
    feature: "Prix tout compris (pas de coût caché)",
    leadcortex: "✓",
    apollo: "✗ (crédits en sus)",
    hunter: "✗ (crédits en sus)",
    lemlist: "✗ (add-ons)",
    clay: "✗ (crédits IA)",
  },
];
