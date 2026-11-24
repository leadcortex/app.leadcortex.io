// frontend/lib/companies/preferences.ts

export type CompanySortBy = "intent" | "name" | "manual" | "employees" | "revenue";
export type CompanyView = "table" | "cards";
export type CompanyDensity = "comfortable" | "compact";

export type CompanyPreferences = {
  industry: string;
  intent: string;
  minEmployees: number;
  sortBy: CompanySortBy;
  view: CompanyView;
  hideKnownCompanies: boolean;
  tablesInOwnContainer: boolean;

  pageSize: number;
  density: CompanyDensity;
  showIntent: boolean;
  showEmployees: boolean;
  showRevenue: boolean;
  showContacts: boolean;
};

export const COMPANY_PREFERENCES_KEY = "leadcortex-companies-preferences-v2";
const LEGACY_PREFERENCES_KEY = "leadcortex-companies-preferences-v1";

export const industries = [
  "Tous",
  "Aerospace",
  "Automotive",
  "Metallurgy",
  "Defense",
  "Logistics",
  "Energy",
  "Manufacturing",
  "Electrical",
  "Technology",
  "Software",
  "Finance",
  "Ecommerce",
  "Media",
  "Transport",
  "Retail",
  "Healthcare",
  "Consulting",
] as const;

export const intents = ["Tous", "hot", "warm", "cold"] as const;

export const intentLabels: Record<string, string> = {
  hot: "Chaude",
  warm: "Tiède",
  cold: "Froide",
};

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

export const KNOWN_COMPANIES_AUTO_HIDE_THRESHOLD = 20;

const DEFAULTS: CompanyPreferences = {
  industry: "Tous",
  intent: "Tous",
  minEmployees: 0,
  sortBy: "intent",
  view: "table",
  hideKnownCompanies: false,
  tablesInOwnContainer: false,
  pageSize: 10,
  density: "comfortable",
  showIntent: true,
  showEmployees: true,
  showRevenue: true,
  showContacts: true,
};

function coerce<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function coerceBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function coerceNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

export function readCompanyPreferences(): CompanyPreferences {
  if (typeof window === "undefined") return DEFAULTS;

  try {
    const raw = window.localStorage.getItem(COMPANY_PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CompanyPreferences> | null;
      if (parsed && typeof parsed === "object") {
        return {
          industry: coerce(parsed.industry, industries, DEFAULTS.industry),
          intent: coerce(parsed.intent, intents, DEFAULTS.intent),
          minEmployees: coerceNumber(parsed.minEmployees, 0, 100_000, DEFAULTS.minEmployees),
          sortBy: coerce(
            parsed.sortBy,
            ["intent", "name", "manual", "employees", "revenue"] as const,
            DEFAULTS.sortBy,
          ),
          view: coerce(parsed.view, ["table", "cards"] as const, DEFAULTS.view),
          hideKnownCompanies: coerceBool(
            parsed.hideKnownCompanies,
            DEFAULTS.hideKnownCompanies,
          ),
          tablesInOwnContainer: coerceBool(
            parsed.tablesInOwnContainer,
            DEFAULTS.tablesInOwnContainer,
          ),
          pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed.pageSize as number)
            ? (parsed.pageSize as number)
            : DEFAULTS.pageSize,
          density: coerce(
            parsed.density,
            ["comfortable", "compact"] as const,
            DEFAULTS.density,
          ),
          showIntent: coerceBool(parsed.showIntent, DEFAULTS.showIntent),
          showEmployees: coerceBool(parsed.showEmployees, DEFAULTS.showEmployees),
          showRevenue: coerceBool(parsed.showRevenue, DEFAULTS.showRevenue),
          showContacts: coerceBool(parsed.showContacts, DEFAULTS.showContacts),
        };
      }
    }
  } catch {
  }

  try {
    const legacy = window.localStorage.getItem(LEGACY_PREFERENCES_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<CompanyPreferences> | null;
      if (parsed && typeof parsed === "object") {
        const migrated: CompanyPreferences = {
          ...DEFAULTS,
          industry: coerce(parsed.industry, industries, DEFAULTS.industry),
          intent: coerce(parsed.intent, intents, DEFAULTS.intent),
          sortBy: coerce(
            parsed.sortBy,
            ["intent", "name", "manual", "employees", "revenue"] as const,
            DEFAULTS.sortBy,
          ),
          view: coerce(parsed.view, ["table", "cards"] as const, DEFAULTS.view),
          hideKnownCompanies: coerceBool(
            parsed.hideKnownCompanies,
            DEFAULTS.hideKnownCompanies,
          ),
          tablesInOwnContainer: coerceBool(
            parsed.tablesInOwnContainer,
            DEFAULTS.tablesInOwnContainer,
          ),
        };
        try {
          window.localStorage.setItem(COMPANY_PREFERENCES_KEY, JSON.stringify(migrated));
          window.localStorage.removeItem(LEGACY_PREFERENCES_KEY);
        } catch {
        }
        return migrated;
      }
    }
  } catch {
  }

  return DEFAULTS;
}

export function writeCompanyPreferences(prefs: CompanyPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMPANY_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
  }
}

export type SyncAutoHideCompaniesResult = {
  patch: Partial<CompanyPreferences> | null;
  justHidden: boolean;
  justRevealed: boolean;
};

export function syncAutoHideKnownCompanies(
  previousCount: number,
  currentCount: number,
  prefs: CompanyPreferences,
): SyncAutoHideCompaniesResult {
  const wasAbove = previousCount >= KNOWN_COMPANIES_AUTO_HIDE_THRESHOLD;
  const isAbove = currentCount >= KNOWN_COMPANIES_AUTO_HIDE_THRESHOLD;

  if (!wasAbove && isAbove && !prefs.hideKnownCompanies) {
    return { patch: { hideKnownCompanies: true }, justHidden: true, justRevealed: false };
  }
  if (wasAbove && !isAbove && prefs.hideKnownCompanies) {
    return { patch: { hideKnownCompanies: false }, justHidden: false, justRevealed: true };
  }
  return { patch: null, justHidden: false, justRevealed: false };
}
