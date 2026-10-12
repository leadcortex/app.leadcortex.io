//frontend\lib\docs-content.ts
export type DocLink = {
  title: string;
  href: string;
  description: string;
};

export type DocSection = {
  id: string;
  title: string;
  description: string;
  links: DocLink[];
};

export const docSections: DocSection[] = [
  {
    id: "demarrage",
    title: "Démarrage",
    description: "Les bases pour lancer votre premier cycle de prospection.",
    links: [
      {
        title: "Bien démarrer sur LeadCortex",
        href: "/docs/demarrage-rapide",
        description: "Créer un workspace, connecter une clé IA et lancer votre première recherche.",
      },
      {
        title: "Comprendre les crédits d'enrichissement",
        href: "/docs/enrichissement",
        description: "Comment sont consommés les crédits et comment éviter le gaspillage.",
      },
    ],
  },
  {
    id: "prospection",
    title: "Prospection & données",
    description: "Trouver les bons comptes et les bons contacts.",
    links: [
      {
        title: "Recherche par langage naturel",
        href: "/docs/prospection",
        description: "Écrire des requêtes efficaces et affiner avec les filtres firmographiques.",
      },
      {
        title: "Séquences & outreach",
        href: "/docs/sequences",
        description: "Construire des séquences multi-étapes et suivre les réponses.",
      },
    ],
  },
  {
    id: "automatisation",
    title: "Automatisation",
    description: "L'éditeur de workflows et les intégrations IA.",
    links: [
      {
        title: "L'éditeur de workflows",
        href: "/docs/workflows",
        description: "Blocs, connexions, exécution — construire un pipeline visuel.",
      },
      {
        title: "BYOK & modèles IA",
        href: "/docs/integrations-ia",
        description: "Connecter Groq, DeepSeek, Mistral ou un modèle personnalisé.",
      },
    ],
  },
];

export const legalLinks: DocLink[] = [
  {
    title: "Conditions Générales d'Utilisation",
    href: "/legal/cgu",
    description: "Les règles du jeu entre vous et LeadCortex.",
  },
  {
    title: "Conditions Générales de Vente",
    href: "/legal/cgv",
    description: "Tarifs, paiement, résiliation et responsabilité.",
  },
  {
    title: "Politique de confidentialité",
    href: "/legal/confidentialite",
    description: "Ce que nous collectons, pourquoi, et comment le supprimer.",
  },
  {
    title: "Accord de traitement des données (DPA)",
    href: "/legal/dpa",
    description: "Pour les équipes soumises au RGPD ou à une revue fournisseur.",
  },
  {
    title: "Politique de cookies",
    href: "/legal/cookies",
    description: "Les traceurs utilisés sur le site et l'application.",
  },
  {
    title: "Mentions légales",
    href: "/legal/mentions-legales",
    description: "Éditeur, hébergeur, directeur de publication.",
  },
];

export function findAdjacentDocs(currentHref: string) {
  const flat = docSections.flatMap((s) => s.links);
  const index = flat.findIndex((l) => l.href === currentHref);
  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
  };
}
