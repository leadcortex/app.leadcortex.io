// frontend/lib/people/preferences.ts

export type SortBy = "score" | "name" | "manual" | "company";
export type PeopleView = "table" | "cards";
export type PeopleDensity = "comfortable" | "compact";

export type PeoplePreferences = {
  industry: string;
  stage: string;
  minScore: number;
  sortBy: SortBy;
  view: PeopleView;
  hideKnownPeople: boolean;
  pageSize: number;
  density: PeopleDensity;
  showAvatars: boolean;
  showSignals: boolean;
  showScores: boolean;
  showStages: boolean;
  
  showPoste: boolean;
  showLangue: boolean;
  showPays: boolean;
  showSite: boolean;
  showCompanySize: boolean;
  
  showIndustry: boolean;
  showTrader: boolean;
};

export const PEOPLE_PREFERENCES_KEY = "leadcortex-people-preferences-v3";
const LEGACY_PREFERENCES_KEY_V2 = "leadcortex-people-preferences-v2";

export const industries = [
  "Tous", "Aerospace", "Automotive", "Metallurgy", "Defense", "Logistics", 
  "Energy", "Manufacturing", "Electrical", "Technology", "Software", 
  "Finance", "Ecommerce", "Media", "Transport",
] as const;

export const stages = ["Tous", "new", "contacted", "replied", "meeting", "won", "lost"] as const;

export const stageLabels: Record<string, string> = {
  new: "Nouveau", contacted: "Contacté", replied: "Répondu", 
  meeting: "Rendez-vous", won: "Gagné", lost: "Perdu",
};

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const KNOWN_PEOPLE_AUTO_HIDE_THRESHOLD = 20;

const DEFAULTS: PeoplePreferences = {
  industry: "Tous",
  stage: "Tous",
  minScore: 0,
  sortBy: "score",
  view: "table",
  hideKnownPeople: false,
  pageSize: 50,
  density: "compact",
  showAvatars: true,
  showSignals: true,
  showScores: true,
  showStages: true,
  showPoste: true,
  showLangue: true,
  showPays: true,
  showSite: true,
  showCompanySize: true,
  showIndustry: false,
  showTrader: false,
};

function coerce<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T) : fallback;
}

function coerceBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function coerceNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value)) : fallback;
}

export function readPeoplePreferences(): PeoplePreferences {
  if (typeof window === "undefined") return DEFAULTS;

  try {
    const raw = window.localStorage.getItem(PEOPLE_PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PeoplePreferences> | null;
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULTS,
          ...parsed,
          industry: coerce(parsed.industry, industries, DEFAULTS.industry),
          stage: coerce(parsed.stage, stages, DEFAULTS.stage),
          minScore: coerceNumber(parsed.minScore, 0, 10, DEFAULTS.minScore),
          sortBy: coerce(parsed.sortBy, ["score", "name", "manual", "company"] as const, DEFAULTS.sortBy),
          view: coerce(parsed.view, ["table", "cards"] as const, DEFAULTS.view),
          pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed.pageSize as number) ? (parsed.pageSize as number) : DEFAULTS.pageSize,
          density: coerce(parsed.density, ["comfortable", "compact"] as const, DEFAULTS.density),
        };
      }
    }
  } catch {  }

  try {
    const legacy = window.localStorage.getItem(LEGACY_PREFERENCES_KEY_V2);
    if (legacy) {
      const parsed = JSON.parse(legacy) as any;
      if (parsed) {
        const migrated = { ...DEFAULTS, ...parsed, view: "table", density: "compact" };
        writePeoplePreferences(migrated);
        window.localStorage.removeItem(LEGACY_PREFERENCES_KEY_V2);
        return migrated;
      }
    }
  } catch {  }

  return DEFAULTS;
}

export function writePeoplePreferences(prefs: PeoplePreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PEOPLE_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {  }
}

export type SyncAutoHideResult = {
  patch: Partial<PeoplePreferences> | null;
  justHidden: boolean;
  justRevealed: boolean;
};

export function syncAutoHideKnownPeople(
  previousCount: number, currentCount: number, prefs: PeoplePreferences,
): SyncAutoHideResult {
  const wasAbove = previousCount >= KNOWN_PEOPLE_AUTO_HIDE_THRESHOLD;
  const isAbove = currentCount >= KNOWN_PEOPLE_AUTO_HIDE_THRESHOLD;

  if (!wasAbove && isAbove && !prefs.hideKnownPeople) {
    return { patch: { hideKnownPeople: true }, justHidden: true, justRevealed: false };
  }
  if (wasAbove && !isAbove && prefs.hideKnownPeople) {
    return { patch: { hideKnownPeople: false }, justHidden: false, justRevealed: true };
  }
  return { patch: null, justHidden: false, justRevealed: false };
}
