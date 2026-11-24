// frontend/components/leadex-ia/leadex-catalog.ts

import type { LeadexAction, LeadexCategory } from "./leadex-types";

export const LEADEX_ACTIONS: LeadexAction[] = [
  {
    id: "import-leads-csv",
    category: "import",
    label: "Importer des leads (CSV)",
    description:
      "Chargez un fichier CSV pour créer des centaines de leads en une passe, avec mapping de colonnes et dédoublonnage automatique.",
    risk: "safe",
    cost: "low",
    estimatedDuration: "1 à 5 min",
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
    id: "import-companies-csv",
    category: "import",
    label: "Importer des entreprises (CSV)",
    description:
      "Créez des comptes à partir d'un CSV (nom, domaine, secteur, effectif).",
    risk: "safe",
    cost: "low",
    estimatedDuration: "1 à 5 min",
    inputs: [
      { type: "file", key: "file", label: "Fichier CSV", accept: ".csv", required: true },
    ],
    examples: ["Importe mes 500 entreprises", "Charge ce fichier de comptes"],
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
  {
    id: "bulk-score-leads",
    category: "scoring",
    label: "Scorer un lot de leads",
    description:
      "Recalculez le score de priorité sur un lot, avec pondérations taille / signal / fraîcheur.",
    risk: "safe",
    cost: "low",
    estimatedDuration: "30 s à 2 min",
    inputs: [{ type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 10000 }],
    examples: ["Rescore tous mes leads", "Score les 1 000 leads récents"],
  },
  {
    id: "bulk-dedupe-leads",
    category: "cleanup",
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
    description: "Envoie un email personnalisé à un segment, avec A/B testing optionnel.",
    risk: "destructive",
    cost: "medium",
    estimatedDuration: "5 à 30 min",
    inputs: [
      { type: "text", key: "subject", label: "Objet", required: true },
      { type: "number", key: "limit", label: "Nombre max de destinataires", min: 1, max: 1000 },
    ],
    examples: ["Envoie une annonce produit", "Relance les leads froids"],
  },
  {
    id: "bulk-delete-leads",
    category: "cleanup",
    label: "Supprimer des leads",
    description: "Supprime définitivement un lot filtré. Une confirmation est requise.",
    risk: "destructive",
    cost: "low",
    estimatedDuration: "30 s",
    inputs: [
      { type: "number", key: "limit", label: "Nombre max de leads", min: 1, max: 5000 },
    ],
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
    id: "bulk-update-field",
    category: "leads",
    label: "Mettre à jour un champ en masse",
    description:
      "Applique une valeur à un champ (source, étape, statut, owner) sur un lot filtré.",
    risk: "moderate",
    cost: "low",
    estimatedDuration: "30 s à 2 min",
    inputs: [
      {
        type: "select",
        key: "field",
        label: "Champ à modifier",
        options: [
          { value: "stage", label: "Étape" },
          { value: "owner", label: "Propriétaire" },
          { value: "source", label: "Source" },
        ],
        required: true,
      },
      { type: "text", key: "value", label: "Nouvelle valeur", required: true },
      { type: "number", key: "limit", label: "Nombre max", min: 1, max: 10000 },
    ],
    examples: ["Change l'étape des leads froids", "Réassigne 300 leads à Marie"],
  },
  {
    id: "bulk-find-icp-leads",
    category: "leads",
    label: "Trouver de nouveaux leads (ICP)",
    description:
      "Recherche et crée de nouveaux leads correspondant à votre ICP (secteur, taille, poste).",
    risk: "moderate",
    cost: "high",
    estimatedDuration: "5 à 15 min",
    inputs: [
      { type: "text", key: "industry", label: "Secteur" },
      {
        type: "select",
        key: "size",
        label: "Taille d'entreprise",
        options: [
          { value: "1-10", label: "1 à 10" },
          { value: "11-50", label: "11 à 50" },
          { value: "51-200", label: "51 à 200" },
          { value: "201-1000", label: "201 à 1000" },
          { value: "1000+", label: "1000+" },
        ],
      },
      { type: "text", key: "title", label: "Intitulé de poste" },
      { type: "number", key: "target", label: "Objectif (nombre de leads)", min: 1, max: 500 },
    ],
    examples: [
      "Trouve-moi 50 CTOs dans la SaaS",
      "Cherche 100 leads en FinTech à Paris",
    ],
  },
];

export function getLeadexAction(id: string): LeadexAction | undefined {
  return LEADEX_ACTIONS.find((a) => a.id === id);
}

export function actionsByCategory(category: LeadexCategory): LeadexAction[] {
  return LEADEX_ACTIONS.filter((a) => a.category === category);
}

export const LEADEX_CATEGORY_LABELS: Record<LeadexCategory, string> = {
  import: "Importer",
  leads: "Leads",
  companies: "Entreprises",
  enrichment: "Enrichir",
  scoring: "Scorer",
  sequences: "Séquences",
  emails: "Emails",
  export: "Exporter",
  cleanup: "Nettoyer",
};

export const LEADEX_CATEGORY_ORDER: LeadexCategory[] = [
  "import",
  "leads",
  "companies",
  "enrichment",
  "scoring",
  "sequences",
  "emails",
  "export",
  "cleanup",
];
