/**
 * Catalogue frontend des badges (miroir de standard-badges.yaml).
 *
 * L'API Academy n'expose pas encore d'endpoint `/badges`. En attendant,
 * ce catalogue permet d'afficher les métadonnées visuelles (nom, icône,
 * couleur, rareté) dans le profil apprenant.
 *
 * À remplacer par `GET /api/v1/badges` dès qu'il sera disponible — la
 * structure est identique pour faciliter la migration.
 */
import type { BadgeCategory, BadgeRarity } from "./types";

export type BadgeCatalogEntry = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
};

export const BADGES_CATALOG: BadgeCatalogEntry[] = [
  // ─── Progression ──────────────────────────────────────────────────
  {
    id: "first-steps",
    name: "Premiers pas",
    description: "Tu as terminé ta première leçon.",
    icon: "footsteps",
    color: "#3186FF",
    category: "progress",
    rarity: "common",
  },
  {
    id: "first-program",
    name: "Premier programme",
    description: "Tu as terminé un programme entier.",
    icon: "medal",
    color: "#3186FF",
    category: "progress",
    rarity: "rare",
  },
  {
    id: "marathon-runner",
    name: "Marathonien",
    description: "10 leçons terminées.",
    icon: "flag",
    color: "#3186FF",
    category: "progress",
    rarity: "rare",
  },
  // ─── Streak ───────────────────────────────────────────────────────
  {
    id: "streak-3",
    name: "Premier élan",
    description: "3 jours d'affilée.",
    icon: "flame",
    color: "#F5A623",
    category: "streak",
    rarity: "common",
  },
  {
    id: "streak-7",
    name: "Une semaine solide",
    description: "7 jours consécutifs sans rater.",
    icon: "flame",
    color: "#F5A623",
    category: "streak",
    rarity: "common",
  },
  {
    id: "streak-14",
    name: "Rythme de croisière",
    description: "14 jours consécutifs.",
    icon: "flame",
    color: "#F5A623",
    category: "streak",
    rarity: "rare",
  },
  {
    id: "streak-30",
    name: "Un mois sans faiblir",
    description: "30 jours consécutifs.",
    icon: "flame",
    color: "#E5584A",
    category: "streak",
    rarity: "epic",
  },
  {
    id: "streak-100",
    name: "Série légendaire",
    description: "100 jours consécutifs.",
    icon: "flame",
    color: "#E5584A",
    category: "streak",
    rarity: "legendary",
  },
  // ─── Niveau ───────────────────────────────────────────────────────
  {
    id: "level-5",
    name: "Prospecteur",
    description: "Niveau 5 atteint.",
    icon: "star",
    color: "#8B5CF6",
    category: "progress",
    rarity: "common",
  },
  {
    id: "level-10",
    name: "Chasseur",
    description: "Niveau 10 atteint.",
    icon: "star",
    color: "#8B5CF6",
    category: "progress",
    rarity: "rare",
  },
  {
    id: "level-20",
    name: "Stratège",
    description: "Niveau 20 atteint.",
    icon: "star",
    color: "#8B5CF6",
    category: "progress",
    rarity: "epic",
  },
  {
    id: "level-30",
    name: "Vétéran",
    description: "Niveau 30 atteint.",
    icon: "star",
    color: "#F5A623",
    category: "progress",
    rarity: "epic",
  },
  {
    id: "level-50",
    name: "Maître",
    description: "Niveau 50 atteint.",
    icon: "crown",
    color: "#FFD166",
    category: "progress",
    rarity: "legendary",
  },
  // ─── Maîtrise ─────────────────────────────────────────────────────
  {
    id: "concepts-5-mastered",
    name: "Bases solides",
    description: "5 concepts maîtrisés.",
    icon: "brain",
    color: "#10B981",
    category: "mastery",
    rarity: "common",
  },
  {
    id: "concepts-25-mastered",
    name: "Encyclopédiste",
    description: "25 concepts maîtrisés.",
    icon: "brain",
    color: "#10B981",
    category: "mastery",
    rarity: "rare",
  },
  // ─── Missions ─────────────────────────────────────────────────────
  {
    id: "missions-5",
    name: "Exécutant",
    description: "5 missions in-app réussies.",
    icon: "check-circle",
    color: "#0EA5E9",
    category: "mission",
    rarity: "common",
  },
  {
    id: "missions-25",
    name: "Opérateur aguerri",
    description: "25 missions in-app réussies.",
    icon: "check-circle",
    color: "#0EA5E9",
    category: "mission",
    rarity: "rare",
  },
  // ─── Secrets ──────────────────────────────────────────────────────
  {
    id: "night-owl",
    name: "Oiseau de nuit",
    description: "Badge caché. Tu as étudié après minuit.",
    icon: "moon",
    color: "#6366F1",
    category: "secret",
    rarity: "rare",
  },
  {
    id: "early-bird",
    name: "Lève-tôt",
    description: "Badge caché. Tu as étudié avant 7h.",
    icon: "sunrise",
    color: "#F5A623",
    category: "secret",
    rarity: "rare",
  },
];

export function findBadge(id: string): BadgeCatalogEntry | undefined {
  return BADGES_CATALOG.find((b) => b.id === id);
}