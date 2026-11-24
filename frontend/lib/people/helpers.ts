// frontend/lib/people/helpers.ts

import type { SearchSelectOption } from "@/components/common/search-select";
import { stageLabels } from "@/lib/people/preferences";

export { stageLabels };

export const SIGNAL_OPTIONS: string[] = [
  "Levée de fonds",
  "Recrutement en cours",
  "Nouveau produit / lancement",
  "Expansion internationale",
  "Changement de poste",
  "Acquisition / fusion",
  "Ouverture de bureau",
  "Croissance du chiffre d'affaires",
  "Nouveau dirigeant",
  "Partenariat annoncé",
  "Investissement R&D",
];

export const STAGE_OPTIONS: SearchSelectOption[] = [
  { value: "new", label: "Nouveau", description: "Pas encore contacté" },
  { value: "contacted", label: "Contacté", description: "Premier message envoyé" },
  { value: "replied", label: "Répondu", description: "A répondu à un email" },
  { value: "meeting", label: "Rendez-vous", description: "Meeting planifié" },
  { value: "won", label: "Gagné", description: "Client signé" },
  { value: "lost", label: "Perdu", description: "Opportunité fermée" },
];

export const INDUSTRY_OPTIONS: string[] = [
  "Aerospace", "Automotive", "Metallurgy", "Defense", "Logistics", "Energy",
  "Manufacturing", "Electrical", "Technology", "Software / SaaS", "Healthcare",
  "Pharmaceutical", "Finance", "Insurance", "Banking", "Retail", "E-commerce",
  "Construction", "Real Estate", "Consulting", "Legal", "Marketing / Ads",
  "Media", "Telecom", "Education", "Hospitality", "Food & Beverage",
  "Agriculture", "Transportation", "Chemical", "Mining", "Textile",
  "Public sector", "Non-profit",
];

export type ActivityItem = {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "view" | "signal";
  label: string;
  detail: string;
  time: string;
};

export type NoteItem = {
  id: string;
  text: string;
  time: string;
  author: string;
};

export type CallPhase = "confirm" | "dialing" | "connected" | "ended";
