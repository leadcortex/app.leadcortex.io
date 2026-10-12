//frontend\lib\enrichment-mock.ts
export type EnrichableField = "email" | "phone" | "linkedin" | "company";
export type EnrichmentField = EnrichableField | "full";

export type EnrichmentProviderStatus = "connected" | "available" | "paused" | "error";

export type EnrichmentProvider = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: EnrichmentProviderStatus;
  priority: number;
  costPerLead: number;
  creditsRemaining?: number;

  coverage: Record<EnrichableField, number>;
  supports: EnrichableField[];
  website?: string;
  lastSync?: string;
};

export type EnrichmentJob = {
  id: string;
  leadId?: string;
  leadName: string;
  company: string;
  field: EnrichmentField;
  providerId: string;
  providerName: string;
  status: "success" | "failed" | "skipped";
  cost: number;
  timestamp: string;
};

export const PROVIDER_BRAND: Record<string, { color: string; initial: string }> = {
  apollo: { color: "#2563eb", initial: "A" },
  hunter: { color: "#f97316", initial: "H" },
  dropcontact: { color: "#ec4899", initial: "D" },
  kaspr: { color: "#8b5cf6", initial: "K" },
  cognism: { color: "#06b6d4", initial: "C" },
  lusha: { color: "#14b8a6", initial: "L" },
};

export function providerBrand(slug: string) {
  return PROVIDER_BRAND[slug] ?? { color: "#6b7280", initial: slug.slice(0, 1).toUpperCase() };
}

export const DEFAULT_PROVIDERS: EnrichmentProvider[] = [
  {
    id: "p-apollo",
    name: "Apollo Waterfall",
    slug: "apollo",
    description: "Base B2B mondiale, forte couverture email + firmographique.",
    status: "connected",
    priority: 1,
    costPerLead: 1,
    creditsRemaining: 1240,
    coverage: { email: 92, phone: 68, linkedin: 88, company: 84 },
    supports: ["email", "phone", "linkedin", "company"],
    website: "apollo.io",
    lastSync: "il y a 4 min",
  },
  {
    id: "p-hunter",
    name: "Hunter.io",
    slug: "hunter",
    description: "Spécialiste email pro — vérification en temps réel.",
    status: "connected",
    priority: 2,
    costPerLead: 1,
    creditsRemaining: 380,
    coverage: { email: 78, phone: 0, linkedin: 0, company: 42 },
    supports: ["email", "company"],
    website: "hunter.io",
    lastSync: "il y a 12 min",
  },
  {
    id: "p-dropcontact",
    name: "Dropcontact",
    slug: "dropcontact",
    description: "Enrichissement RGPD, très fort sur les PME françaises.",
    status: "connected",
    priority: 3,
    costPerLead: 2,
    creditsRemaining: 210,
    coverage: { email: 84, phone: 56, linkedin: 62, company: 76 },
    supports: ["email", "phone", "linkedin", "company"],
    website: "dropcontact.com",
    lastSync: "il y a 1 h",
  },
  {
    id: "p-kaspr",
    name: "Kaspr",
    slug: "kaspr",
    description: "Numéros de mobile directs depuis LinkedIn.",
    status: "available",
    priority: 4,
    costPerLead: 3,
    creditsRemaining: 0,
    coverage: { email: 71, phone: 89, linkedin: 94, company: 71 },
    supports: ["email", "phone", "linkedin"],
    website: "kaspr.io",
  },
  {
    id: "p-cognism",
    name: "Cognism",
    slug: "cognism",
    description: "Base premium Europe, téléphones vérifiés.",
    status: "available",
    priority: 5,
    costPerLead: 3,
    creditsRemaining: 0,
    coverage: { email: 88, phone: 92, linkedin: 79, company: 85 },
    supports: ["email", "phone", "linkedin", "company"],
    website: "cognism.com",
  },
];

const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();

export const DEFAULT_JOBS: EnrichmentJob[] = [
  {
    id: "j1",
    leadName: "Marie Lefèvre",
    company: "Sopra Steria",
    field: "email",
    providerId: "p-apollo",
    providerName: "Apollo",
    status: "success",
    cost: 1,
    timestamp: ago(1),
  },
  {
    id: "j2",
    leadName: "Thomas Bernard",
    company: "Airbus",
    field: "phone",
    providerId: "p-apollo",
    providerName: "Apollo",
    status: "success",
    cost: 1,
    timestamp: ago(1.5),
  },
  {
    id: "j3",
    leadName: "Sophie Martin",
    company: "Doctolib",
    field: "email",
    providerId: "p-hunter",
    providerName: "Hunter",
    status: "success",
    cost: 1,
    timestamp: ago(2),
  },
  {
    id: "j4",
    leadName: "Lucas Petit",
    company: "Qonto",
    field: "email",
    providerId: "p-apollo",
    providerName: "Apollo",
    status: "failed",
    cost: 0,
    timestamp: ago(3),
  },
  {
    id: "j5",
    leadName: "Emma Roux",
    company: "Mistral AI",
    field: "linkedin",
    providerId: "p-dropcontact",
    providerName: "Dropcontact",
    status: "success",
    cost: 2,
    timestamp: ago(5),
  },
  {
    id: "j6",
    leadName: "Hugo Moreau",
    company: "Alan",
    field: "phone",
    providerId: "p-dropcontact",
    providerName: "Dropcontact",
    status: "success",
    cost: 2,
    timestamp: ago(8),
  },
  {
    id: "j7",
    leadName: "Chloé Simon",
    company: "Payfit",
    field: "email",
    providerId: "p-hunter",
    providerName: "Hunter",
    status: "success",
    cost: 1,
    timestamp: ago(12),
  },
  {
    id: "j8",
    leadName: "Nathan Laurent",
    company: "Back Market",
    field: "company",
    providerId: "p-apollo",
    providerName: "Apollo",
    status: "success",
    cost: 1,
    timestamp: ago(20),
  },
  {
    id: "j9",
    leadName: "Léa Dubois",
    company: "Contentsquare",
    field: "email",
    providerId: "p-apollo",
    providerName: "Apollo",
    status: "success",
    cost: 1,
    timestamp: ago(28),
  },
  {
    id: "j10",
    leadName: "Antoine Girard",
    company: "Spendesk",
    field: "phone",
    providerId: "p-kaspr",
    providerName: "Kaspr",
    status: "skipped",
    cost: 0,
    timestamp: ago(36),
  },
];

export const DEFAULT_CREDITS_TOTAL = 500;
export const DEFAULT_CREDITS_USED = 158;
