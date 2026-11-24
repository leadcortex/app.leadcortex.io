// frontend/lib/mobile/nav-tree.ts

import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  Layers,
  Send,
  Mail,
  Phone,
  LayoutGrid,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Briefcase,
  Workflow,
  BarChart3,
  Eye,
  FileInput,
  Bookmark,
  GraduationCap,
  Home,
  MoreHorizontal,
} from "@/components/icons";

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
  opensSheet?: boolean;
};

export const MOBILE_NAV_SECTIONS: MobileNavSection[] = [
  {
    key: "academy",
    label: "Academy",
    icon: GraduationCap,
    matches: ["/app/academy"],
    items: [{ to: "/app/academy", label: "Parcours", icon: GraduationCap, exact: true }],
  },
  {
    key: "people",
    label: "Prospects",
    icon: Users,
    matches: ["/app/people"],
    items: [{ to: "/app/people", label: "Prospects", icon: Users }],
  },
  {
    key: "companies",
    label: "Entreprises",
    icon: Building2,
    matches: ["/app/companies"],
    items: [{ to: "/app/companies", label: "Entreprises", icon: Building2 }],
  },
  {
    key: "home",
    label: "Accueil",
    icon: Home,
    matches: ["/app"],
    items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    key: "hub",
    label: "Hub",
    icon: LayoutGrid,
    matches: ["/app/hub"],
    items: [{ to: "/app/hub", label: "Hub", icon: LayoutGrid }],
  },
  {
    key: "other",
    label: "Autre",
    icon: MoreHorizontal,
    matches: [
      "/app/sequences",
      "/app/emails",
      "/app/calls",
      "/app/tasks",
      "/app/meetings",
      "/app/conversations",
      "/app/deals",
      "/app/lists",
      "/app/enrichment",
      "/app/analytics",
      "/app/visitors",
      "/app/forms",
      "/app/saved",
      "/app/workflows",
    ],
    items: [],
    opensSheet: true,
    groups: [
      {
        label: "Engager",
        items: [
          { to: "/app/sequences", label: "Séquences", icon: Send },
          { to: "/app/emails", label: "Emails", icon: Mail },
          { to: "/app/calls", label: "Appels", icon: Phone },
          { to: "/app/tasks", label: "Tâches", icon: CheckSquare },
        ],
      },
      {
        label: "Gagner",
        items: [
          { to: "/app/meetings", label: "Meetings", icon: CalendarDays },
          { to: "/app/conversations", label: "Conversations", icon: MessageSquare },
          { to: "/app/deals", label: "Opportunités", icon: Briefcase },
        ],
      },
      {
        label: "Prospecter & enrichir",
        items: [
          { to: "/app/lists", label: "Listes", icon: ListChecks },
          { to: "/app/enrichment", label: "Enrichissement", icon: Layers },
        ],
      },
      {
        label: "Outils",
        items: [
          { to: "/app/workflows", label: "Workflows", icon: Workflow },
          { to: "/app/analytics", label: "Analyses", icon: BarChart3 },
        ],
      },
      {
        label: "Inbound",
        items: [
          { to: "/app/visitors", label: "Visiteurs", icon: Eye },
          { to: "/app/forms", label: "Formulaires", icon: FileInput },
        ],
      },
      {
        label: "Sauvegardés",
        items: [{ to: "/app/saved", label: "Prospects & entreprises", icon: Bookmark }],
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
