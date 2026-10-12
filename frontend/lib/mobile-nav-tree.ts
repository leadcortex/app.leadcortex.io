//frontend\lib\mobile-nav-tree.ts
import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  Wand2,
  Send,
  Mail,
  Phone,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Target,
  Workflow,
  BarChart3,
  Eye,
  FileInput,
  Bookmark,
  Settings2,
  Search,
  Rocket,
  Inbox,
  Wrench,
  Home,
} from "lucide-react";

export type MobileNavLink = {
  to: string;
  label: string;
  icon: typeof Users;
  exact?: boolean;
};

export type MobileNavSubGroup = {
  label: string;
  items: MobileNavLink[];
};

export type MobileNavSection = {
  key: string;
  label: string;
  icon: typeof Users;

  matches: string[];
  items: MobileNavLink[];
  groups?: MobileNavSubGroup[];
};

export const MOBILE_NAV_SECTIONS: MobileNavSection[] = [
  {
    key: "prospect",
    label: "Prospecter & enrichir",
    icon: Search,
    matches: [
      "/app/people",
      "/app/companies",
      "/app/lists",
      "/app/enrichment",
      "/app/saved",
      "/app/settings",
    ],
    items: [
      { to: "/app/people", label: "Prospects", icon: Users },
      { to: "/app/companies", label: "Entreprises", icon: Building2 },
      { to: "/app/lists", label: "Listes", icon: ListChecks },
      { to: "/app/enrichment", label: "Enrichissement", icon: Wand2 },
    ],
  },
  {
    key: "home",
    label: "Accueil",
    icon: Home,
    matches: ["/app"],
    items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    key: "engage",
    label: "Engager & Gagner",
    icon: Rocket,
    matches: [
      "/app/sequences",
      "/app/emails",
      "/app/calls",
      "/app/tasks",
      "/app/meetings",
      "/app/conversations",
      "/app/deals",
    ],
    items: [
      { to: "/app/sequences", label: "Séquences", icon: Send },
      { to: "/app/emails", label: "Emails", icon: Mail },
      { to: "/app/calls", label: "Appels", icon: Phone },
      { to: "/app/tasks", label: "Tâches", icon: CheckSquare },
      { to: "/app/meetings", label: "Meetings", icon: CalendarDays },
      { to: "/app/conversations", label: "Conversations", icon: MessageSquare },
      { to: "/app/deals", label: "Opportunités", icon: Target },
    ],
  },
  {
    key: "tools",
    label: "Outils",
    icon: Wrench,
    matches: ["/app/workflows", "/app/analytics"],
    items: [
      { to: "/app/workflows", label: "Workflows", icon: Workflow },
      { to: "/app/analytics", label: "Analyses", icon: BarChart3 },
    ],
  },
  {
    key: "inbound",
    label: "Inbound",
    icon: Inbox,
    matches: ["/app/visitors", "/app/forms", "/app/saved", "/app/settings"],
    items: [
      { to: "/app/visitors", label: "Visiteurs", icon: Eye },
      { to: "/app/forms", label: "Formulaires", icon: FileInput },
    ],

    groups: [
      {
        label: "Sauvegardés & Réglages",
        items: [
          { to: "/app/saved", label: "Sauvegardés", icon: Bookmark },
          { to: "/app/settings", label: "Réglages", icon: Settings2 },
        ],
      },
    ],
  },
];

export function isSectionActive(section: MobileNavSection, pathname: string): boolean {
  if (section.key === "home") return pathname === "/app" || pathname === "/app/";
  return section.matches.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}

export function isLinkActive(link: MobileNavLink, pathname: string): boolean {
  if (link.exact) return pathname === link.to || pathname === `${link.to}/`;
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}
