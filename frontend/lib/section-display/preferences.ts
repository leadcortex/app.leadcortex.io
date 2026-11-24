// frontend/lib/section-display/preferences.ts

import type { PeoplePreferences } from "@/lib/people/preferences";
import {
  readPeoplePreferences,
  writePeoplePreferences,
  PAGE_SIZE_OPTIONS,
} from "@/lib/people/preferences";

export type TableDensity = "comfortable" | "compact";
export type TableView = "table" | "cards";

export type GenericTablePrefs = {
  density: TableDensity;
  pageSize: number;
  view: TableView;
};

export type CompaniesSectionPrefs = GenericTablePrefs & {
  defaultIntent: "all" | "hot" | "warm" | "cold";
};

export type DashboardSectionPrefs = {
  showPipeline: boolean;
  showPriorities: boolean;
  showSignals: boolean;
  showRecent: boolean;
  showTasks: boolean;
  showMeetings: boolean;
  showKnown: boolean;
};

export const DEFAULT_GENERIC_TABLE_PREFS: GenericTablePrefs = {
  density: "comfortable",
  pageSize: 10,
  view: "table",
};

export const DEFAULT_COMPANIES_PREFS: CompaniesSectionPrefs = {
  ...DEFAULT_GENERIC_TABLE_PREFS,
  defaultIntent: "all",
};

export const DEFAULT_DASHBOARD_PREFS: DashboardSectionPrefs = {
  showPipeline: true,
  showPriorities: true,
  showSignals: true,
  showRecent: true,
  showTasks: true,
  showMeetings: true,
  showKnown: true,
};

const COMPANIES_PREFS_KEY = "leadcortex-companies-preferences-v1";
const DASHBOARD_PREFS_KEY = "leadcortex-dashboard-preferences-v1";

function coerce<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
}

function coerceBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function coercePageSize(v: unknown, fallback: number): number {
  return typeof v === "number" &&
    (PAGE_SIZE_OPTIONS as readonly number[]).includes(v)
    ? v
    : fallback;
}

export function readCompaniesPrefs(): CompaniesSectionPrefs {
  if (typeof window === "undefined") return DEFAULT_COMPANIES_PREFS;
  try {
    const raw = window.localStorage.getItem(COMPANIES_PREFS_KEY);
    if (!raw) return DEFAULT_COMPANIES_PREFS;
    const p = JSON.parse(raw) as Partial<CompaniesSectionPrefs> | null;
    if (!p || typeof p !== "object") return DEFAULT_COMPANIES_PREFS;
    return {
      density: coerce(p.density, ["comfortable", "compact"] as const, DEFAULT_COMPANIES_PREFS.density),
      pageSize: coercePageSize(p.pageSize, DEFAULT_COMPANIES_PREFS.pageSize),
      view: coerce(p.view, ["table", "cards"] as const, DEFAULT_COMPANIES_PREFS.view),
      defaultIntent: coerce(
        p.defaultIntent,
        ["all", "hot", "warm", "cold"] as const,
        DEFAULT_COMPANIES_PREFS.defaultIntent,
      ),
    };
  } catch {
    return DEFAULT_COMPANIES_PREFS;
  }
}

export function writeCompaniesPrefs(prefs: CompaniesSectionPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMPANIES_PREFS_KEY, JSON.stringify(prefs));
  } catch {
  }
}

export function readDashboardPrefs(): DashboardSectionPrefs {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_PREFS;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_PREFS_KEY);
    if (!raw) return DEFAULT_DASHBOARD_PREFS;
    const p = JSON.parse(raw) as Partial<DashboardSectionPrefs> | null;
    if (!p || typeof p !== "object") return DEFAULT_DASHBOARD_PREFS;
    return {
      showPipeline: coerceBool(p.showPipeline, DEFAULT_DASHBOARD_PREFS.showPipeline),
      showPriorities: coerceBool(p.showPriorities, DEFAULT_DASHBOARD_PREFS.showPriorities),
      showSignals: coerceBool(p.showSignals, DEFAULT_DASHBOARD_PREFS.showSignals),
      showRecent: coerceBool(p.showRecent, DEFAULT_DASHBOARD_PREFS.showRecent),
      showTasks: coerceBool(p.showTasks, DEFAULT_DASHBOARD_PREFS.showTasks),
      showMeetings: coerceBool(p.showMeetings, DEFAULT_DASHBOARD_PREFS.showMeetings),
      showKnown: coerceBool(p.showKnown, DEFAULT_DASHBOARD_PREFS.showKnown),
    };
  } catch {
    return DEFAULT_DASHBOARD_PREFS;
  }
}

export function writeDashboardPrefs(prefs: DashboardSectionPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(prefs));
  } catch {
  }
}

export { readPeoplePreferences, writePeoplePreferences };
export type { PeoplePreferences };

const densityLabel: Record<TableDensity, string> = {
  comfortable: "Confort",
  compact: "Compact",
};

const viewLabel: Record<TableView, string> = {
  table: "Tableau",
  cards: "Cartes",
};

export function summarizePeople(prefs: PeoplePreferences): string {
  return `${densityLabel[prefs.density]} · ${prefs.pageSize}/page · ${viewLabel[prefs.view]}`;
}

export function summarizeCompanies(prefs: CompaniesSectionPrefs): string {
  const intentLabel: Record<CompaniesSectionPrefs["defaultIntent"], string> = {
    all: "Toutes",
    hot: "Chaudes",
    warm: "Tièdes",
    cold: "Froides",
  };
  return `${densityLabel[prefs.density]} · ${prefs.pageSize}/page · ${intentLabel[prefs.defaultIntent]}`;
}

export function summarizeDashboard(prefs: DashboardSectionPrefs): string {
  const blocks = [
    prefs.showPipeline && "Pipeline",
    prefs.showPriorities && "Priorités",
    prefs.showSignals && "Signaux",
    prefs.showRecent && "Récents",
    prefs.showTasks && "Tâches",
    prefs.showMeetings && "RDV",
    prefs.showKnown && "Décideurs",
  ].filter(Boolean);
  return `${blocks.length}/7 blocs actifs`;
}
