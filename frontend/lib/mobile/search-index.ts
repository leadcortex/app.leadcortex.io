// frontend/lib/mobile/search-index.ts

import { useMemo } from "react";
import {
  BarChart3,
  Bell,
  Bookmark,
  Boxes,
  Brain,
  Building2,
  CalendarDays,
  CheckSquare,
  CircleUserRound,
  Clock,
  CreditCard,
  Eye,
  FileInput,
  GraduationCap,
  Home,
  LayoutDashboard,
  Lightbulb,
  Link2,
  ListChecks,
  Mail,
  MessageSquare,
  Monitor,
  Phone,
  Plug,
  Send,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wand2,
  Workflow,
  Wrench,
  type LucideIcon,
} from "@/components/icons";

import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/components/settings/settings-context";
import { useAppStore } from "@/lib/state/store";
import { cleanQuery, fuzzyMatch } from "../core/fuzzy-search";

export type SearchCategory =
  | "Navigation"
  | "Paramètres"
  | "Prospects"
  | "Entreprises"
  | "Séquences"
  | "Opportunités"
  | "Tâches"
  | "Meetings";

export type SearchAction =
  | { type: "navigate"; to: string }
  | { type: "settings"; section: SettingsSection };

export type SearchEntry = {
  id: string;
  label: string;
  description: string;
  keywords: string;
  icon: LucideIcon;
  category: SearchCategory;
  action: SearchAction;
};

const SETTINGS_ICONS: Record<SettingsSection, LucideIcon> = {
  account: CircleUserRound,
  billing: CreditCard,
  general: SettingsIcon,
  display: Monitor,
  notifications: Bell,
  security: ShieldCheck,
  integrations: Link2,
  capabilities: Sparkles,
  memory: Brain,
  thinking: Lightbulb,
  time: Clock,
  skills: Wrench,
  connectors: Plug,
  plugins: Boxes,
};

const STATIC_NAV: Array<{
  id: string;
  label: string;
  description: string;
  keywords: string;
  icon: LucideIcon;
  to: string;
}> = [
  { id: "nav:/app", label: "Dashboard", description: "Vue d'ensemble", keywords: "accueil home tableau de bord overview", icon: Home, to: "/app" },
  { id: "nav:/app/people", label: "Prospects", description: "Base de contacts", keywords: "leads personnes contacts clients", icon: Users, to: "/app/people" },
  { id: "nav:/app/companies", label: "Entreprises", description: "Comptes cibles", keywords: "companies societes comptes organisations", icon: Building2, to: "/app/companies" },
  { id: "nav:/app/lists", label: "Listes", description: "Groupes de prospects", keywords: "lists groupes segments", icon: ListChecks, to: "/app/lists" },
  { id: "nav:/app/enrichment", label: "Enrichissement", description: "Emails, téléphones, profils", keywords: "enrich data waterfall apollo hunter", icon: Wand2, to: "/app/enrichment" },
  { id: "nav:/app/sequences", label: "Séquences", description: "Campagnes multicanal", keywords: "sequences cadences outreach campagnes", icon: Send, to: "/app/sequences" },
  { id: "nav:/app/emails", label: "Emails", description: "Boîte de réception", keywords: "inbox mails messagerie courriels", icon: Mail, to: "/app/emails" },
  { id: "nav:/app/calls", label: "Appels", description: "Historique des appels", keywords: "calls telephones telephonique", icon: Phone, to: "/app/calls" },
  { id: "nav:/app/tasks", label: "Tâches", description: "À faire", keywords: "tasks todo actions", icon: CheckSquare, to: "/app/tasks" },
  { id: "nav:/app/meetings", label: "Meetings", description: "Rendez-vous", keywords: "rdv rendez vous agenda calendar", icon: CalendarDays, to: "/app/meetings" },
  { id: "nav:/app/conversations", label: "Conversations", description: "Messagerie unifiée", keywords: "chats discussions linkedin whatsapp", icon: MessageSquare, to: "/app/conversations" },
  { id: "nav:/app/deals", label: "Opportunités", description: "Pipeline commercial", keywords: "deals pipeline ventes affaires", icon: Target, to: "/app/deals" },
  { id: "nav:/app/workflows", label: "Workflows", description: "Automatisations", keywords: "workflows automatisations automation", icon: Workflow, to: "/app/workflows" },
  { id: "nav:/app/analytics", label: "Analyses", description: "Statistiques & KPI", keywords: "stats analytics rapports metriques", icon: BarChart3, to: "/app/analytics" },
  { id: "nav:/app/visitors", label: "Visiteurs", description: "Trafic entrant", keywords: "visitors inbound trafic site", icon: Eye, to: "/app/visitors" },
  { id: "nav:/app/forms", label: "Formulaires", description: "Captation de leads", keywords: "forms inbound formulaires", icon: FileInput, to: "/app/forms" },
  { id: "nav:/app/saved", label: "Sauvegardés", description: "Vos favoris", keywords: "saved favoris bookmarks enregistres", icon: Bookmark, to: "/app/saved" },
  { id: "nav:/app/academy", label: "Academy", description: "Parcours de formation", keywords: "academy formation apprendre cours", icon: GraduationCap, to: "/app/academy" },
];

export function useMobileSearchIndex(): SearchEntry[] {
  const store = useAppStore();

  return useMemo(() => {
    const navigation: SearchEntry[] = STATIC_NAV.map((e) => ({
      id: e.id,
      label: e.label,
      description: e.description,
      keywords: e.keywords,
      icon: e.icon,
      category: "Navigation",
      action: { type: "navigate", to: e.to },
    }));

    const settings: SearchEntry[] = SETTINGS_SECTIONS.map((s) => ({
      id: `settings:${s.key}`,
      label: s.label,
      description: s.description,
      keywords: `${s.keywords ?? ""} parametres reglages settings preferences ${s.group} configuration`,
      icon: SETTINGS_ICONS[s.key] ?? SettingsIcon,
      category: "Paramètres",
      action: { type: "settings", section: s.key },
    }));

    const leads: SearchEntry[] = store.leads.map((l) => ({
      id: `lead:${l.id}`,
      label: l.name,
      description: `${l.title} · ${l.company}`,
      keywords: `${l.company} ${l.title} ${l.email ?? ""} ${l.industry} ${l.location} lead prospect`,
      icon: Users,
      category: "Prospects",
      action: { type: "navigate", to: `/app/people/${l.id}` },
    }));

    const companies: SearchEntry[] = store.companies.map((c) => ({
      id: `company:${c.id}`,
      label: c.name,
      description: `${c.industry} · ${c.location}`,
      keywords: `${c.domain} ${c.industry} ${c.location} entreprise company`,
      icon: Building2,
      category: "Entreprises",
      action: { type: "navigate", to: `/app/companies/${c.id}` },
    }));

    const sequences: SearchEntry[] = store.sequences.map((s) => ({
      id: `seq:${s.id}`,
      label: s.name,
      description: `${s.leads} leads · ${s.opens} ouverture`,
      keywords: "sequence campaign cadence",
      icon: Send,
      category: "Séquences",
      action: { type: "navigate", to: `/app/sequences/${s.id}` },
    }));

    const deals: SearchEntry[] = store.deals.map((d) => ({
      id: `deal:${d.id}`,
      label: d.name,
      description: `${d.company} · ${d.amount.toLocaleString("fr-FR")} €`,
      keywords: `${d.company} ${d.contact} deal opportunite`,
      icon: Target,
      category: "Opportunités",
      action: { type: "navigate", to: `/app/deals/${d.id}` },
    }));

    const tasks: SearchEntry[] = store.tasks.map((t) => ({
      id: `task:${t.id}`,
      label: t.title,
      description: t.contact,
      keywords: `${t.contact} ${t.type} task`,
      icon: CheckSquare,
      category: "Tâches",
      action: { type: "navigate", to: `/app/tasks` },
    }));

    const meetings: SearchEntry[] = store.meetings.map((m) => ({
      id: `meeting:${m.id}`,
      label: m.title,
      description: `${m.with} · ${m.company}`,
      keywords: `${m.with} ${m.company} meeting rdv`,
      icon: CalendarDays,
      category: "Meetings",
      action: { type: "navigate", to: `/app/meetings` },
    }));

    return [
      ...navigation,
      ...settings,
      ...leads,
      ...companies,
      ...sequences,
      ...deals,
      ...tasks,
      ...meetings,
    ];
  }, [
    store.leads,
    store.companies,
    store.sequences,
    store.deals,
    store.tasks,
    store.meetings,
  ]);
}

export type SearchHit = {
  entry: SearchEntry;
  score: number;
  indices: number[];
};

export function searchEntries(
  query: string,
  entries: SearchEntry[],
  limit = 14,
): SearchHit[] {
  const q = cleanQuery(query);
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const entry of entries) {
    const labelMatch = fuzzyMatch(q, entry.label);
    if (labelMatch) {
      hits.push({ entry, score: labelMatch.score + 100, indices: labelMatch.indices });
      continue;
    }
    const metaMatch = fuzzyMatch(q, `${entry.keywords} ${entry.description}`);
    if (metaMatch) {
      hits.push({ entry, score: metaMatch.score, indices: [] });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
