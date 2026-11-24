// frontend/lib/companies/helpers.ts

import type { SearchSelectOption } from "@/components/common/search-select";

export const INDUSTRY_OPTIONS: SearchSelectOption[] = [
  { value: "Aerospace", label: "Aéronautique", description: "Constructeurs, MRO, sous-traitance" },
  { value: "Automotive", label: "Automobile", description: "OEM, équipementiers, mobilité" },
  { value: "Metallurgy", label: "Métallurgie", description: "Sidérurgie, fonderie, usinage" },
  { value: "Defense", label: "Défense", description: "Systèmes, sécurité, souveraineté" },
  { value: "Logistics", label: "Logistique", description: "Transport, supply chain, entrepôts" },
  { value: "Energy", label: "Énergie", description: "Renouvelable, nucléaire, réseaux" },
  { value: "Manufacturing", label: "Industrie", description: "Production, usines, process" },
  { value: "Electrical", label: "Électrique", description: "Composants, électronique, câblage" },
  { value: "Technology", label: "Technologie", description: "SaaS, éditeurs, ESN" },
  { value: "Software", label: "Logiciel / SaaS", description: "Éditeurs, plateformes, cloud" },
  { value: "Healthcare", label: "Santé", description: "Cliniques, medtech, pharma" },
  { value: "Pharmaceutical", label: "Pharmaceutique", description: "Laboratoires, biotech" },
  { value: "Finance", label: "Finance", description: "Banque, assurance, fintech" },
  { value: "Insurance", label: "Assurance", description: "Courtage, mutuelles, réassurance" },
  { value: "Banking", label: "Banque", description: "Banques de détail, BFI, néobanques" },
  { value: "Retail", label: "Retail", description: "Commerce, e-commerce, distribution" },
  { value: "Ecommerce", label: "E-commerce", description: "Marketplaces, D2C, dropshipping" },
  { value: "Construction", label: "Construction", description: "BTP, ingénierie, immobilier" },
  { value: "RealEstate", label: "Immobilier", description: "Promoteurs, gestion, proptech" },
  { value: "Consulting", label: "Conseil", description: "Stratégie, IT, RH, management" },
  { value: "Legal", label: "Juridique", description: "Cabinets d'avocats, legaltech" },
  { value: "Marketing", label: "Marketing / Publicité", description: "Agences, adtech, médias" },
  { value: "Media", label: "Média", description: "Presse, audiovisuel, streaming" },
  { value: "Telecom", label: "Télécom", description: "Opérateurs, réseaux, équipementiers" },
  { value: "Education", label: "Éducation", description: "Écoles, edtech, formation" },
  { value: "Hospitality", label: "Hôtellerie / Tourisme", description: "Hôtels, restauration, voyages" },
  { value: "Food", label: "Agroalimentaire", description: "Production, distribution, foodtech" },
  { value: "Agriculture", label: "Agriculture", description: "Agritech, coopératives, intrants" },
  { value: "Transport", label: "Transport", description: "Fret, passagers, mobilité" },
  { value: "Chemical", label: "Chimie", description: "Chimie fine, pétrochimie, matériaux" },
  { value: "Mining", label: "Mines & Carrières", description: "Extraction, minéraux, métaux" },
  { value: "Textile", label: "Textile", description: "Confection, mode, technique" },
  { value: "PublicSector", label: "Secteur public", description: "Administrations, collectivités" },
  { value: "NonProfit", label: "Association", description: "ONG, fondations, ESS" },
];

export const SIZE_OPTIONS: SearchSelectOption[] = [
  { value: "1-10", label: "1-10", description: "Très petite structure", group: "TPE / Startup" },
  { value: "11-50", label: "11-50", description: "Startup / PME", group: "TPE / Startup" },
  { value: "51-200", label: "51-200", description: "PME en croissance", group: "PME / ETI" },
  { value: "201-500", label: "201-500", description: "ETI", group: "PME / ETI" },
  { value: "500-1K", label: "500-1K", description: "Grande ETI", group: "PME / ETI" },
  { value: "1K-5K", label: "1K-5K", description: "Grand compte", group: "Grands comptes" },
  { value: "5K-10K", label: "5K-10K", description: "Groupe national", group: "Grands comptes" },
  { value: "10K+", label: "10K+", description: "Groupe international", group: "Grands comptes" },
];

export type CompanyIntentValue = "hot" | "warm" | "cold";

export const INTENT_OPTIONS: SearchSelectOption[] = [
  {
    value: "hot",
    label: "Forte intention",
    description: "Signaux d'achat récents, à contacter en priorité",
    keywords: "hot chaud forte",
  },
  {
    value: "warm",
    label: "Intention moyenne",
    description: "Intérêt latent, à nourrir",
    keywords: "warm tiede moyen",
  },
  {
    value: "cold",
    label: "Faible intention",
    description: "À surveiller, pas de signal",
    keywords: "cold froid faible",
  },
];

export const intentLabels: Record<string, string> = {
  hot: "Chaude",
  warm: "Tiède",
  cold: "Froide",
};

export const SOURCE_OPTIONS: SearchSelectOption[] = [
  { value: "manual", label: "Saisie manuelle", description: "Créé depuis cette fiche", group: "Direct" },
  { value: "import", label: "Import CSV / Excel", description: "Depuis un fichier", group: "Direct" },
  {
    value: "linkedin",
    label: "LinkedIn Sales Navigator",
    description: "Recherche Sales Nav",
    group: "Outbound",
  },
  {
    value: "website",
    label: "Visiteurs du site",
    description: "Détection de visite",
    group: "Inbound",
  },
  {
    value: "event",
    label: "Salon / événement",
    description: "Carte de visite scannée",
    group: "Terrain",
  },
  { value: "partner", label: "Partenaire", description: "Apport d'affaires", group: "Terrain" },
  { value: "referral", label: "Recommandation", description: "Bouche-à-oreille", group: "Terrain" },
];

export const OWNER_OPTIONS: SearchSelectOption[] = [
  { value: "Moi", label: "Moi", description: "Compte personnel", group: "Utilisateurs" },
  { value: "Équipe Sales", label: "Équipe Sales", description: "Équipe commerciale", group: "Équipes" },
  { value: "Équipe Growth", label: "Équipe Growth", description: "Équipe croissance", group: "Équipes" },
  {
    value: "Équipe CS",
    label: "Équipe Customer Success",
    description: "Suivi client",
    group: "Équipes",
  },
  { value: "Non assigné", label: "Non assigné", description: "À attribuer", group: "Autres" },
];

export function parseEmployees(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function formatEmployees(n: number): string {
  if (!n) return "—";
  return n.toLocaleString("fr-FR");
}

export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}
