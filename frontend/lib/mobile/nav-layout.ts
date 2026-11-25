// frontend/lib/mobile/nav-layout.ts
// Règles de la barre de navigation mobile personnalisable (module pur, sans React).

import {
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  CheckSquare,
  Eye,
  FileInput,
  GraduationCap,
  Home,
  Layers,
  LayoutGrid,
  ListChecks,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Send,
  Users,
  Workflow,
} from "@/components/icons";
import type { MobileNavSection, MobileNavSubGroup } from "./nav-tree";

export type NavPage = {
  key: string;
  label: string;
  icon: typeof Users;
  to: string;
  exact?: boolean;
  group: string;
};

/** Toutes les pages qui peuvent aller dans la barre (ordre = ordre dans « Autre »). */
export const NAV_CATALOG: NavPage[] = [
  { key: "academy", label: "Academy", icon: GraduationCap, to: "/app/academy", group: "Principales" },
  { key: "people", label: "Prospects", icon: Users, to: "/app/people", group: "Principales" },
  { key: "companies", label: "Entreprises", icon: Building2, to: "/app/companies", group: "Principales" },
  { key: "home", label: "Accueil", icon: Home, to: "/app", exact: true, group: "Principales" },
  { key: "hub", label: "Hub", icon: LayoutGrid, to: "/app/hub", group: "Principales" },
  { key: "sequences", label: "Séquences", icon: Send, to: "/app/sequences", group: "Engager" },
  { key: "emails", label: "Emails", icon: Mail, to: "/app/emails", group: "Engager" },
  { key: "calls", label: "Appels", icon: Phone, to: "/app/calls", group: "Engager" },
  { key: "tasks", label: "Tâches", icon: CheckSquare, to: "/app/tasks", group: "Engager" },
  { key: "meetings", label: "Meetings", icon: CalendarDays, to: "/app/meetings", group: "Gagner" },
  { key: "conversations", label: "Conversations", icon: MessageSquare, to: "/app/conversations", group: "Gagner" },
  { key: "deals", label: "Opportunités", icon: Briefcase, to: "/app/deals", group: "Gagner" },
  { key: "lists", label: "Listes", icon: ListChecks, to: "/app/lists", group: "Prospecter & enrichir" },
  { key: "enrichment", label: "Enrichissement", icon: Layers, to: "/app/enrichment", group: "Prospecter & enrichir" },
  { key: "workflows", label: "Workflows", icon: Workflow, to: "/app/workflows", group: "Outils" },
  { key: "analytics", label: "Analyses", icon: BarChart3, to: "/app/analytics", group: "Outils" },
  { key: "visitors", label: "Visiteurs", icon: Eye, to: "/app/visitors", group: "Inbound" },
  { key: "forms", label: "Formulaires", icon: FileInput, to: "/app/forms", group: "Inbound" },
  { key: "saved", label: "Prospects & entreprises", icon: Bookmark, to: "/app/saved", group: "Sauvegardés" },
];

export const NAV_MIN = 4;
export const NAV_MAX = 5;

export type MobileNavLayout = { keys: string[]; forceBubble: boolean };

export const DEFAULT_NAV_LAYOUT: MobileNavLayout = {
  keys: ["academy", "people", "companies", "home", "hub"],
  forceBubble: false,
};

/** Bulle ronde : seulement avec 5 sections, si la 1re est Academy ou si la bulle est forcée. */
export function hasBubble(l: MobileNavLayout): boolean {
  return l.keys.length === NAV_MAX && (l.keys[0] === "academy" || l.forceBubble);
}

const KNOWN_KEYS = new Set(NAV_CATALOG.map((p) => p.key));

export function normalizeLayout(raw: unknown): MobileNavLayout {
  if (!raw || typeof raw !== "object") return DEFAULT_NAV_LAYOUT;
  const r = raw as { keys?: unknown; forceBubble?: unknown };
  const input = Array.isArray(r.keys) ? r.keys : [];
  const keys: string[] = [];
  for (const k of input) {
    if (typeof k === "string" && KNOWN_KEYS.has(k) && !keys.includes(k)) keys.push(k);
  }
  for (const k of DEFAULT_NAV_LAYOUT.keys) {
    if (keys.length >= NAV_MIN) break;
    if (!keys.includes(k)) keys.push(k);
  }
  return { keys: keys.slice(0, NAV_MAX), forceBubble: r.forceBubble === true };
}

export function removeKey(l: MobileNavLayout, key: string): MobileNavLayout {
  if (l.keys.length <= NAV_MIN || !l.keys.includes(key)) return l;
  return { ...l, keys: l.keys.filter((k) => k !== key) };
}

export function addKey(l: MobileNavLayout, key: string): MobileNavLayout {
  if (l.keys.length >= NAV_MAX || l.keys.includes(key) || !KNOWN_KEYS.has(key)) return l;
  return { ...l, keys: [...l.keys, key] };
}

export function moveKey(l: MobileNavLayout, from: number, to: number): MobileNavLayout {
  if (from === to || from < 0 || from >= l.keys.length || to < 0 || to >= l.keys.length) return l;
  const keys = [...l.keys];
  const [moved] = keys.splice(from, 1);
  keys.splice(to, 0, moved!);
  return { ...l, keys };
}

function pageToSection(p: NavPage): MobileNavSection {
  return {
    key: p.key,
    label: p.label,
    icon: p.icon,
    matches: [p.to],
    items: [{ to: p.to, label: p.label, icon: p.icon, exact: p.exact }],
  };
}

/** Barre à afficher : bulle éventuelle + sections, « Autre » (pages hors barre) toujours en dernier. */
export function buildBar(l: MobileNavLayout): {
  bubble: MobileNavSection | null;
  main: MobileNavSection[];
} {
  const byKey = new Map(NAV_CATALOG.map((p) => [p.key, p]));
  const sections = l.keys.flatMap((k) => {
    const p = byKey.get(k);
    return p ? [pageToSection(p)] : [];
  });

  const hidden = NAV_CATALOG.filter((p) => !l.keys.includes(p.key));
  const groups: MobileNavSubGroup[] = [];
  for (const p of hidden) {
    let g = groups.find((x) => x.label === p.group);
    if (!g) {
      g = { label: p.group, items: [] };
      groups.push(g);
    }
    g.items.push({ to: p.to, label: p.label, icon: p.icon, exact: p.exact });
  }
  const other: MobileNavSection = {
    key: "other",
    label: "Autre",
    icon: MoreHorizontal,
    matches: hidden.map((p) => p.to),
    items: [],
    opensSheet: true,
    groups,
  };

  const bubble = hasBubble(l) ? sections.shift()! : null;
  return { bubble, main: [...sections, other] };
}
