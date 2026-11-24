// frontend/components/leadex-ia/leadex-actions-catalog.ts

import type { LeadexAction } from "./leadex-types";

export const LEADEX_ACTIONS: LeadexAction[] = [
  {
    id: "import-leads-csv",
    category: "import",
    label: "Importer des leads en masse (CSV)",
    description:
      "Chargez un fichier CSV pour créer des centaines de leads en une passe, avec mapping de colonnes et dédoublonnage automatique.",
    risk: "safe",
    cost: "low",
    estimatedDuration: "1 à 5 min selon la taille",
    inputs: [
      { type: "file", key: "file", label: "Fichier CSV", accept: ".csv", required: true },
      {
        type: "select",
        key: "onDuplicate",
        label: "En cas de doublon",
        options: [
          { value: "skip", label: "Ignorer" },
          { value: "update", label: "Mettre à jour" },
          { value: "create", label: "Créer quand même" },
        ],
      },
    ],
    examples: ["J'ai 2 000 leads à importer", "Importe ce CSV dans Prospects"],
  },
  {
    id: "bulk-enrich-leads",
    category: "enrichment",
    label: "Enrichir des leads en masse",
    description:
      "Ajoutez email, téléphone, poste et entreprise à un lot de leads sélectionnés par filtre.",
    risk: "moderate",
    cost: "medium",
    estimatedDuration: "3 à 15 min",
    inputs: [
      { type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 5000 },
      {
        type: "select",
        key: "source",
        label: "Source d'enrichissement",
        options: [
          { value: "auto", label: "Automatique (waterfall)" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "clearbit", label: "Clearbit" },
        ],
      },
    ],
    examples: ["Enrichis les 500 derniers leads", "Trouve les emails manquants"],
  },
  {
    id: "bulk-score-leads",
    category: "scoring",
    label: "Scorer un lot de leads",
    description:
      "Recalculez le score de priorité sur un lot, avec pondérations size / signal / fraîcheur.",
    risk: "safe",
    cost: "low",
    estimatedDuration: "30 s à 2 min",
    inputs: [
      { type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 10000 },
    ],
    examples: ["Rescore tous mes leads", "Score les 1 000 leads récents"],
  },
  {
    id: "bulk-dedupe-leads",
    category: "leads",
    label: "Détecter et fusionner les doublons",
    description:
      "Repère les doublons (email, nom + entreprise, LinkedIn) et propose une fusion.",
    risk: "moderate",
    cost: "low",
    estimatedDuration: "1 à 3 min",
    inputs: [],
    examples: ["Nettoie mes doublons", "Fusionne les leads en double"],
  },
  {
    id: "bulk-enroll-sequence",
    category: "sequences",
    label: "Enrôler des leads dans une séquence",
    description:
      "Sélectionnez un lot et une séquence, Leadex IA gère l'enrôlement et l'ordonnancement.",
    risk: "moderate",
    cost: "medium",
    estimatedDuration: "1 à 10 min",
    inputs: [
      {
        type: "select",
        key: "sequenceId",
        label: "Séquence cible",
        options: [
          { value: "recrutement-cto", label: "Recrutement CTO" },
          { value: "levee-series-a", label: "Levée Série A" },
          { value: "expansion-us", label: "Expansion US" },
        ],
        required: true,
      },
      { type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 2000 },
    ],
    examples: ["Enrôle mes 200 meilleurs leads", "Ajoute ce segment à la séquence X"],
  },
  {
    id: "bulk-send-emails",
    category: "emails",
    label: "Envoyer un email en masse",
    description:
      "Envoie un email personnalisé à un segment, avec A/B testing optionnel.",
    risk: "destructive",
    cost: "medium",
    estimatedDuration: "5 à 30 min",
    inputs: [
      { type: "text", key: "subject", label: "Objet", required: true },
      { type: "text", key: "body", label: "Corps (markdown)" },
      { type: "number", key: "limit", label: "Nombre max de destinataires", min: 1, max: 1000 },
    ],
    examples: ["Envoie une annonce produit", "Relance les leads froids"],
  },
  {
    id: "bulk-delete-leads",
    category: "leads",
    label: "Supprimer des leads",
    description:
      "Supprime définitivement un lot filtré. Une confirmation est requise.",
    risk: "destructive",
    cost: "low",
    estimatedDuration: "30 s",
    inputs: [{ type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 5000 }],
    examples: ["Supprime les leads sans email", "Supprime les leads désinscrits"],
  },
  {
    id: "bulk-export-leads",
    category: "export",
    label: "Exporter un lot de leads",
    description:
      "Génère un CSV prêt pour l'import dans un autre outil, avec les colonnes choisies.",
    risk: "safe",
    cost: "low",
    estimatedDuration: "moins d'1 min",
    inputs: [{ type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 50000 }],
    examples: ["Exporte mes 5 000 leads", "Exporte ce segment en CSV"],
  },
  {
    id: "bulk-import-companies",
    category: "import",
    label: "Importer des entreprises en masse",
    description: "Créez des comptes à partir d'un CSV (nom, domaine, secteur, effectif).",
    risk: "safe",
    cost: "low",
    estimatedDuration: "1 à 5 min",
    inputs: [{ type: "file", key: "file", label: "Fichier CSV", accept: ".csv", required: true }],
    examples: ["Importe mes 500 entreprises", "Charge ce fichier de comptes"],
  },
  {
    id: "bulk-verify-emails",
    category: "enrichment",
    label: "Vérifier les emails en masse",
    description: "Valide la délivrabilité (SMTP + catch-all) sur un lot.",
    risk: "safe",
    cost: "medium",
    estimatedDuration: "5 à 20 min",
    inputs: [{ type: "number", key: "limit", label: "Nombre max", min: 1, max: 5000 }],
    examples: ["Vérifie mes emails non validés", "Nettoie mes emails invalides"],
  },
];

export function getLeadexAction(id: string): LeadexAction | undefined {
  return LEADEX_ACTIONS.find((a) => a.id === id);
}

export function actionsByCategory(category: LeadexAction["category"]): LeadexAction[] {
  return LEADEX_ACTIONS.filter((a) => a.category === category);
}

export const LEADEX_CATEGORY_LABELS: Record<LeadexAction["category"], string> = {
  leads: "Leads",
  companies: "Entreprises",
  sequences: "Séquences",
  emails: "Emails",
  enrichment: "Enrichissement",
  scoring: "Scoring",
  import: "Import",
  export: "Export",
};
