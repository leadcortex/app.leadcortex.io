// frontend/lib/consent/consent-config.ts

export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE_NAME = "lc_consent";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

export type ConsentCategoryId = "analytics" | "embeds";

export type ConsentCategory = {
  id: ConsentCategoryId;
  enabled: boolean;
  label: string;
  description: string;
  providers: { name: string; purpose: string; privacyUrl: string }[];
  cookiePrefixes: string[];
};

export const OPTIONAL_CATEGORIES: ConsentCategory[] = [
  {
    id: "analytics",
    enabled: false,
    label: "Mesure d'audience",
    description:
      "Nous aide à comprendre comment le site est utilisé afin d'améliorer le produit. Les données servent uniquement à LeadCortex.",
    providers: [],
    cookiePrefixes: ["_ga", "_gid", "_pk_", "_hj", "ph_", "plausible"],
  },
  {
    id: "embeds",
    enabled: false,
    label: "Services tiers intégrés",
    description:
      "Permet d'afficher des contenus ou outils fournis par des tiers (par exemple un widget de support ou une vidéo hébergée).",
    providers: [],
    cookiePrefixes: [],
  },
];

export type CookieInventoryItem = {
  name: string;
  kind: "cookie" | "stockage-local";
  purpose: string;
  duration: string;
};

export const NECESSARY_INVENTORY: CookieInventoryItem[] = [
  {
    name: "lc_session",
    kind: "cookie",
    purpose: "Maintient votre session connectée (cookie HttpOnly, inaccessible aux scripts).",
    duration: "30 jours maximum, ou jusqu'à la déconnexion",
  },
  {
    name: "lc_google_oauth_tx",
    kind: "cookie",
    purpose: "Sécurise la connexion avec Google (protection contre la falsification de requête).",
    duration: "10 minutes",
  },
  {
    name: "better-auth.*",
    kind: "cookie",
    purpose: "Cookies techniques du module d'authentification (session et connexion Google).",
    duration: "7 jours maximum",
  },
  {
    name: "sidebar_state",
    kind: "cookie",
    purpose: "Mémorise si le menu latéral de l'application est ouvert ou fermé.",
    duration: "7 jours",
  },
  {
    name: "lc_consent",
    kind: "cookie",
    purpose: "Conserve vos choix en matière de cookies afin de ne pas vous les redemander.",
    duration: "6 mois",
  },
  {
    name: "leadcortex:*, leadcortex_*, lc.*, cortex.*",
    kind: "stockage-local",
    purpose:
      "Préférences d'interface et données de travail enregistrées dans votre navigateur : thème, largeur des panneaux, position des notifications, mise en page des tableaux, historique et réglages de l'assistant IA.",
    duration: "Jusqu'à leur suppression par vos soins (réglages du navigateur)",
  },
];

export function enabledCategories(): ConsentCategory[] {
  return OPTIONAL_CATEGORIES.filter((c) => c.enabled);
}

export function hasOptionalTrackers(): boolean {
  return enabledCategories().length > 0;
}
