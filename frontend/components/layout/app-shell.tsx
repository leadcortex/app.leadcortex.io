// frontend/components/layout/app-shell.tsx

import { Link, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useMemo, type ReactNode, type DependencyList } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  Building2,
  Layers,
  Send,
  Mail,
  MessageSquare,
  Briefcase,
  Workflow,
  BarChart3,
  Eye,
  FileInput,
  GraduationCap,
  Settings,
} from "@/components/icons";
import { useAppStore } from "@/lib/state/store";
import { useIsMobile, useHydrated } from "@/hooks/use-mobile";
import { useSidebarSide, useMobileNavSide } from "@/lib/core/layout-prefs";
import { HeaderSearch, type SearchPage } from "@/components/layout/header-search";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AssistantSidebar } from "@/components/ai-assistant/assistant-sidebar";
import { AssistantDockButton } from "@/components/ai-assistant/assistant-dock-button";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SuggestionCortex } from "@/components/suggestion/suggestion-cortex";
import { AppTabs, TabProvider } from "@/components/layout/app-tabs";
import { NotificationCenter } from "@/components/layout/notification-center";
import { MobileTopBar } from "@/components/mobile/mobile-top-bar";
import {
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  SettingsProvider,
  useSettings,
} from "@/components/settings/settings-context";
import { SettingsModal } from "@/components/settings/settings-modal";
import { cn } from "@/lib/core/utils";

type NavItem = { to: string; label: string; icon: typeof Users; exact?: boolean; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const staticGroups: NavGroup[] = [
  {
    label: "Accueil",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/app/hub", label: "Hub", icon: LayoutGrid },
    ],
  },
  {
    label: "Academy",
    items: [{ to: "/app/academy", label: "Parcours", icon: GraduationCap }],
  },
  {
    label: "Prospecter & enrichir",
    items: [
      { to: "/app/people", label: "Prospects", icon: Users },
      { to: "/app/companies", label: "Entreprises", icon: Building2 },
      { to: "/app/enrichment", label: "Enrichissement", icon: Layers },
    ],
  },
  {
    label: "Engager",
    items: [
      { to: "/app/sequences", label: "Séquences", icon: Send },
      { to: "/app/emails", label: "Emails", icon: Mail },
    ],
  },
  {
    label: "Gagner",
    items: [
      { to: "/app/conversations", label: "Conversations", icon: MessageSquare },
      { to: "/app/deals", label: "Opportunités", icon: Briefcase },
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
];

const RightPanelContext = createContext<(node: ReactNode) => void>(() => {});

export function useRightPanel(_node: ReactNode, _deps: DependencyList) {
  useContext(RightPanelContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TabProvider>
      <SettingsProvider>
        <AppShellBody>{children}</AppShellBody>
      </SettingsProvider>
    </TabProvider>
  );
}

function AppShellBody({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isMobile = useIsMobile();
  const hydrated = useHydrated();
  const sidebarSide = useSidebarSide();
  const mobileNavSide = useMobileNavSide();
  const { emails, tasks } = useAppStore();

  const isReversed = sidebarSide === "right";
  const mobileNavIsTop = mobileNavSide === "top";

  const isWorkflowBuilder =
    /^\/app\/workflows\/(?!$)/.test(pathname) &&
    pathname !== "/app/workflows" &&
    pathname !== "/app/workflows/";

  const isFullBleed = /^\/app\/(conversations|emails|academy)/.test(pathname);

  const groups = useMemo(() => {
    const unreadEmails = emails.filter((e) => e.unread).length;
    const pendingTasks = tasks.filter((t) => !t.done).length;
    return staticGroups.map((g) => ({
      ...g,
      items: g.items.map((it) => {
        if (it.to === "/app/emails" && unreadEmails > 0)
          return { ...it, badge: String(unreadEmails) };
        if (it.to === "/app/hub" && pendingTasks > 0) return { ...it, badge: String(pendingTasks) };
        return it;
      }),
    }));
  }, [emails, tasks]);

  const badges = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) for (const it of g.items) if (it.badge) map[it.to] = it.badge;
    return map;
  }, [groups]);

  if (isWorkflowBuilder) {
    if (isMobile) {
      return (
        <>
          <div
            data-tab-capture
            className="h-dvh w-screen overflow-hidden bg-background text-foreground text-sm"
          >
            {children}
          </div>
          <SettingsModal />
        </>
      );
    }
    return (
      <>
        <div className="flex h-dvh flex-col overflow-hidden bg-muted/40 text-foreground text-sm p-2 gap-2">
          <TopBar />
          <div
            data-tab-capture
            className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm"
          >
            {children}
          </div>
        </div>
        <SettingsModal />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex h-dvh overflow-hidden bg-muted/40 text-foreground text-sm p-2 gap-2 pb-[calc(var(--pen-nav-h,76px)+0.5rem)] md:pb-2",
          isReversed && "flex-row-reverse",
        )}
      >
        <AppSidebar badges={badges} />

        <div className="flex-1 min-w-0 flex flex-col min-h-0 gap-2">
          {!hydrated ? <TopBarPlaceholder /> : isMobile ? <MobileTopBar /> : <TopBar />}

          <div className={cn("flex-1 flex min-h-0 gap-2", isReversed && "flex-row-reverse")}>
            <main
              data-tab-capture
              className="flex-1 min-w-0 min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm"
            >
              {isFullBleed ? (
                <div className="h-full min-h-0 max-w-full">{children}</div>
              ) : (
                <div
                  data-tab-scroll
                  className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
                >
                  <div className="p-3 md:p-6">{children}</div>
                </div>
              )}
            </main>

            <SuggestionCortex />
            <AssistantSidebar />
          </div>
        </div>

        <MobileBottomNav />
      </div>
      <SettingsModal />
    </>
  );
}

function TopBarPlaceholder() {
  return (
    <header className="relative z-[45] flex shrink-0 items-center gap-2 rounded-2xl border border-border/70 bg-background px-2 py-2 shadow-sm md:px-3 md:py-2.5">
      <div className="hidden w-full items-center justify-between gap-2 md:flex">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          <div className="h-8 w-28 shrink-0 animate-pulse rounded-lg bg-surface/60 md:w-32" />
          <div className="h-8 w-28 shrink-0 animate-pulse rounded-lg bg-surface/60 md:w-32" />
          <div className="h-8 w-28 shrink-0 animate-pulse rounded-lg bg-surface/60 md:w-32" />
        </div>
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <div className="size-8 animate-pulse rounded-lg bg-surface/60" />
          <div className="size-8 animate-pulse rounded-lg bg-surface/60" />
          <div className="size-8 animate-pulse rounded-lg bg-surface/60" />
        </div>
      </div>

      <div className="flex w-full items-center gap-1.5 md:hidden">
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-surface/60" />
        <div className="h-10 flex-1 animate-pulse rounded-full bg-surface/60" />
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-surface/60" />
      </div>
    </header>
  );
}

function TopBar() {
  const { openSettings } = useSettings();

  const pages: SearchPage[] = useMemo(() => {
    const settingsGroups = new Map(SETTINGS_GROUPS.map((group) => [group.key, group.label]));
    return [
      ...staticGroups.flatMap((group) =>
        group.items.map((item) => ({
          label: item.label,
          to: item.to,
          group: group.label,
          icon: item.icon,
        })),
      ),
      ...SETTINGS_SECTIONS.map((section) => ({
        id: `settings-${section.key}`,
        label: section.label,
        to: "/app/settings",
        group: `Paramètres · ${settingsGroups.get(section.group) ?? "Paramètres"}`,
        icon: Settings,
        description: section.description,
        keywords: `${section.key} ${section.keywords ?? ""}`,
        onSelect: () => openSettings(section.key),
      })),
    ];
  }, [openSettings]);

  return (
    <header className="relative z-[45] flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background px-2 py-2 shadow-sm md:px-3 md:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <AppTabs />
      </div>

      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <HeaderSearch pages={pages} />

        <NotificationCenter />

        <AssistantDockButton />
      </div>
    </header>
  );
}
