//frontend\lib\company-database.ts
export type CompanyResult = {
  id: string;
  name: string;
  domain: string | null;
  industry: string;
  industryCode: string;
  location: string;
  city: string;
  countryCode: string;
  employees: number;
  size: string;
  category: string;
  active: boolean;
  createdAt: string | null;
  source: "SIRENE" | "GLEIF";
  sourceUrl: string;
};

export type CompanyDetail = CompanyResult;

const API_BASE = "https://recherche-entreprises.api.gouv.fr";
const GLEIF_API_BASE = "https://api.gleif.org/api/v1/lei-records";
const CACHE_TTL_MS = 1000 * 60 * 30;

const TRANCHE_RANGES: Record<string, { size: string; min: number }> = {
  "00": { size: "0", min: 0 },
  "01": { size: "1-2", min: 1 },
  "02": { size: "3-5", min: 3 },
  "03": { size: "6-9", min: 6 },
  "11": { size: "10-19", min: 10 },
  "12": { size: "20-49", min: 20 },
  "21": { size: "50-99", min: 50 },
  "22": { size: "100-199", min: 100 },
  "31": { size: "200-249", min: 200 },
  "32": { size: "250-499", min: 250 },
  "41": { size: "500-999", min: 500 },
  "42": { size: "1K-2K", min: 1000 },
  "51": { size: "2K-5K", min: 2000 },
  "52": { size: "5K-10K", min: 5000 },
  "53": { size: "10K+", min: 10000 },
};

const NAF_LABELS: Record<string, string> = {
  "62.01Z": "Programmation informatique",
  "62.02A": "Conseil en systèmes informatiques",
  "62.02B": "Tierce maintenance informatique",
  "63.11Z": "Traitement de données / hébergement",
  "64.19Z": "Autres intermédiations monétaires",
  "64.92Z": "Autres activités de crédit",
  "66.19B": "Autres activités auxiliaires de services financiers",
  "70.22Z": "Conseil pour les affaires et la gestion",
  "46.51Z": "Commerce de gros d'ordinateurs",
  "47.91B": "Vente à distance sur catalogue spécialisé",
  "55.10Z": "Hôtels et hébergement similaire",
  "56.10A": "Restauration traditionnelle",
  "41.20A": "Construction de maisons individuelles",
  "43.21A": "Travaux d'installation électrique",
  "49.41A": "Transports routiers de fret interurbains",
  "86.21Z": "Activité des médecins généralistes",
};

function getIndustryLabel(codeNaf: string): string {
  if (!codeNaf) return "—";
  return NAF_LABELS[codeNaf] ?? codeNaf;
}

function getSizeFromTranche(tranche: string | null): { size: string; employees: number } {
  if (!tranche) return { size: "—", employees: 0 };
  const t = TRANCHE_RANGES[tranche];
  if (!t) return { size: "—", employees: 0 };
  return { size: t.size, employees: t.min };
}

function getCategoryLabel(code: string | null): string {
  switch (code) {
    case "TPE":
      return "TPE";
    case "PME":
      return "PME";
    case "ETI":
      return "ETI";
    case "GE":
      return "Grande entreprise";
    default:
      return "—";
  }
}

type RawEntreprise = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  tranche_effectif_salarie?: string | null;
  categorie_entreprise?: string | null;
  etat_administratif?: string;
  date_creation?: string | null;
  siege?: {
    activite_principale?: string;
    adresse?: string;
    code_postal?: string;
    commune?: string;
    pays?: string;
  };
};

type GleifRecord = {
  id?: string;
  attributes?: {
    entity?: {
      legalName?: { name?: string };
      legalAddress?: { city?: string; country?: string };
      jurisdiction?: string;
      category?: string;
      creationDate?: string;
      status?: string;
    };
    registration?: { status?: string };
  };
};

function mapResult(raw: RawEntreprise): CompanyResult {
  const siege = raw.siege ?? {};
  const name = raw.nom_complet ?? raw.nom_raison_sociale ?? "—";
  const codeNaf = siege.activite_principale ?? "";
  const { size, employees } = getSizeFromTranche(raw.tranche_effectif_salarie ?? null);
  const city = siege.commune ?? "";
  const cp = siege.code_postal ?? "";
  const location = city && cp ? `${city} (${cp})` : city || cp || "—";

  return {
    id: String(raw.siren ?? ""),
    name,
    domain: null, // l'API ne fournit pas de domaine → résolution côté UI
    industry: getIndustryLabel(codeNaf),
    industryCode: codeNaf,
    location,
    city,
    countryCode: "FR",
    employees,
    size,
    category: getCategoryLabel(raw.categorie_entreprise ?? null),
    active: raw.etat_administratif === "A",
    createdAt: raw.date_creation ?? null,
    source: "SIRENE",
    sourceUrl: `https://annuaire-entreprises.data.gouv.fr/entreprise/${raw.siren ?? ""}`,
  };
}

function mapGleifResult(raw: GleifRecord): CompanyResult | null {
  const entity = raw.attributes?.entity;
  const lei = raw.id?.trim();
  const name = entity?.legalName?.name?.trim();
  if (!lei || !name) return null;

  const city = entity.legalAddress?.city ?? "";
  const countryCode = entity.legalAddress?.country ?? entity.jurisdiction ?? "";

  return {
    id: `GLEIF:${lei}`,
    name,
    domain: null,
    industry: "—",
    industryCode: "",
    location: [city, countryCode].filter(Boolean).join(", ") || "—",
    city,
    countryCode,
    employees: 0,
    size: "—",
    category: entity.category ?? "Entité LEI",
    active: entity.status === "ACTIVE" && raw.attributes?.registration?.status === "ISSUED",
    createdAt: entity.creationDate ?? null,
    source: "GLEIF",
    sourceUrl: `https://search.gleif.org/#/record/${lei}`,
  };
}

type CacheEntry<T> = { value: T; expiresAt: number };
const memCache = new Map<string, CacheEntry<CompanyResult[]>>();

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const e = map.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    map.delete(key);
    return null;
  }
  return e.value;
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, value: T) {
  map.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function searchCompanies(query: string, limit = 20): Promise<CompanyResult[]> {
  const q = query.trim();
  if (!q) return [];

  const cacheKey = `${q}::${limit}`;
  const cached = getCached(memCache, cacheKey);
  if (cached) return cached;

  const [sireneResult, gleifResult] = await Promise.allSettled([
    fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&per_page=${Math.min(limit, 25)}&page=1`, {
      headers: { Accept: "application/json", "User-Agent": "LeadCortex/1.0" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`SIRENE HTTP ${response.status}`);
      const json = (await response.json()) as { results?: RawEntreprise[] };
      return (json.results ?? []).map(mapResult);
    }),
    fetch(
      `${GLEIF_API_BASE}?${new URLSearchParams({
        "filter[entity.legalName]": q,
        "page[size]": String(Math.min(limit, 25)),
      })}`,
      { headers: { Accept: "application/vnd.api+json" } },
    ).then(async (response) => {
      if (!response.ok) throw new Error(`GLEIF HTTP ${response.status}`);
      const json = (await response.json()) as { data?: GleifRecord[] };
      return (json.data ?? []).flatMap((record) => {
        const result = mapGleifResult(record);
        return result ? [result] : [];
      });
    }),
  ]);

  if (sireneResult.status === "rejected") {
    console.error("[company-database] SIRENE search error:", sireneResult.reason);
  }
  if (gleifResult.status === "rejected") {
    console.error("[company-database] GLEIF search error:", gleifResult.reason);
  }

  const results = [
    ...(sireneResult.status === "fulfilled" ? sireneResult.value : []),
    ...(gleifResult.status === "fulfilled" ? gleifResult.value : []),
  ];
  const uniqueResults = Array.from(
    new Map(results.map((result) => [result.id, result])).values(),
  ).slice(0, limit);
  setCached(memCache, cacheKey, uniqueResults);
  return uniqueResults;
}

export async function getCompanyBySiren(siren: string): Promise<CompanyResult | null> {
  const clean = siren.trim();
  if (!clean) return null;
  const results = await searchCompanies(clean, 1);
  return results[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Logos                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * URL du logo Hunter.io pour un domaine.
 * Renvoie "" si pas de domaine (l'UI affichera un avatar coloré).
 */
export function getCompanyLogoUrl(domain: string | null | undefined): string {
  if (!domain) return "";
  const clean = domain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (!clean) return "";
  return `https://logo.clearbit.com/${clean}`;
}

const KNOWN_DOMAINS: Record<string, string> = {
  google: "google.com",
  apple: "apple.com",
  microsoft: "microsoft.com",
  amazon: "amazon.com",
  meta: "meta.com",
  facebook: "facebook.com",
  netflix: "netflix.com",
  spotify: "spotify.com",
  airbnb: "airbnb.com",
  uber: "uber.com",
  stripe: "stripe.com",
  shopify: "shopify.com",
  slack: "slack.com",
  notion: "notion.so",
  figma: "figma.com",
  adobe: "adobe.com",
  salesforce: "salesforce.com",
  zoom: "zoom.us",
  linkedin: "linkedin.com",
  tesla: "tesla.com",
  nvidia: "nvidia.com",
  openai: "openai.com",
  github: "github.com",
  dropbox: "dropbox.com",
  twitter: "twitter.com",
  x: "x.com",
};

export function guessDomainFromName(name: string): string | null {
  const clean = name.trim().toLowerCase();
  if (!clean) return null;

  for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
    if (clean === key || clean.startsWith(key + " ") || clean.startsWith(key + "-")) {
      return domain;
    }
  }

  const normalized = clean
    .replace(/\b(sas|sarl|sa|sasu|eurl|sci|scp|gie|group|groupe|france|fr)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (normalized.length >= 3 && normalized.length <= 30) {
    return `${normalized}.fr`;
  }

  return null;
}
