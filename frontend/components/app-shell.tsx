//frontend\components\app-shell.tsx
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type DependencyList,
} from "react";
import { toast } from "sonner";
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
  Search,
  Bell,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarSide, useMobileNavSide } from "@/lib/layout-prefs";
import { GlobalSearch } from "@/components/global-search";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AssistantSidebar } from "@/components/ai-assistant/assistant-sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SuggestionCortex } from "@/components/suggestion-cortex";
import { AppTabs, TabProvider } from "@/components/app-tabs";
import { SettingsProvider } from "@/components/settings/settings-context";
import { SettingsModal } from "@/components/settings/settings-modal";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Users; exact?: boolean; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const staticGroups: NavGroup[] = [
  {
    label: "Accueil",
    items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Prospecter & enrichir",
    items: [
      { to: "/app/people", label: "Prospects", icon: Users },
      { to: "/app/companies", label: "Entreprises", icon: Building2 },
      { to: "/app/lists", label: "Listes", icon: ListChecks },
      { to: "/app/enrichment", label: "Enrichissement", icon: Wand2 },
    ],
  },
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
      { to: "/app/deals", label: "Opportunités", icon: Target },
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
  const sidebarSide = useSidebarSide();
  const mobileNavSide = useMobileNavSide();
  const { emails, tasks } = useAppStore();

  const isReversed = sidebarSide === "right";
  const mobileNavIsTop = mobileNavSide === "top";

  const isWorkflowBuilder =
    /^\/app\/workflows\/(?!$)/.test(pathname) &&
    pathname !== "/app/workflows" &&
    pathname !== "/app/workflows/";

  const isFullBleed = /^\/app\/(conversations|emails)/.test(pathname);

  const groups = useMemo(() => {
    const unreadEmails = emails.filter((e) => e.unread).length;
    const pendingTasks = tasks.filter((t) => !t.done).length;
    return staticGroups.map((g) => ({
      ...g,
      items: g.items.map((it) => {
        if (it.to === "/app/emails" && unreadEmails > 0)
          return { ...it, badge: String(unreadEmails) };
        if (it.to === "/app/tasks" && pendingTasks > 0)
          return { ...it, badge: String(pendingTasks) };
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
          <div className="h-dvh w-screen overflow-hidden bg-background text-foreground text-sm">
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
          <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            {children}
          </div>
        </div>
        <SettingsModal />
      </>
    );
  }

  const navReserveStyle = isMobile
    ? mobileNavIsTop
      ? { paddingTop: "calc(var(--pen-nav-h, 76px) + 0.5rem)" }
      : { paddingBottom: "calc(var(--pen-nav-h, 76px) + 0.5rem)" }
    : undefined;

  return (
    <>
      <div
        className={cn(
          "flex h-dvh overflow-hidden bg-muted/40 text-foreground text-sm p-2 gap-2",
          isReversed && "flex-row-reverse",
        )}
        style={navReserveStyle}
      >
        <AppSidebar badges={badges} />

        <div className="flex-1 min-w-0 flex flex-col min-h-0 gap-2">
          <TopBar />

          <div className={cn("flex-1 flex min-h-0 gap-2", isReversed && "flex-row-reverse")}>
            <main className="flex-1 min-w-0 min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
              {isFullBleed ? (
                <div className="h-full min-h-0 max-w-full">{children}</div>
              ) : (
                <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
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

type Cmd = { label: string; to: string; group: string; icon: typeof Users };

function TopBar() {
  const navigate = useNavigate();
  const { notifications, markNotificationsRead, addActivity } = useAppStore();
  const unreadNotif = notifications.filter((n) => !n.read).length;

  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands: Cmd[] = useMemo(
    () =>
      staticGroups.flatMap((g) =>
        g.items.map((it) => ({ label: it.label, to: it.to, group: g.label, icon: it.icon })),
      ),
    [],
  );

  const go = (to: string) => {
    navigate({ to });
    setCmdOpen(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.to.toLowerCase().includes(q),
    );
  }, [commands, query]);

  return (
    <header className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background px-2 py-2 shadow-sm md:px-3 md:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <AppTabs />
      </div>

      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <button
          aria-label="Notifications"
          onClick={() => markNotificationsRead()}
          className="relative rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2"
        >
          <Bell className="size-4 md:size-5" strokeWidth={1.5} />
          {unreadNotif > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[8px] text-white md:text-[10px]">
              {unreadNotif}
            </span>
          )}
        </button>

        <button
          aria-label="Quick add activity"
          onClick={() => {
            try {
              addActivity?.("Quick activity", "Ajoutée depuis la barre supérieure");
              toast.success("Activité ajoutée");
            } catch {
              /* Intentionally ignored. */
            }
          }}
          className="rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2"
        >
          <Plus className="size-4 md:size-5" strokeWidth={1.5} />
        </button>

        <button
          aria-label="Ouvrir la recherche globale"
          onClick={() => setSearchOpen(true)}
          className="rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2"
        >
          <Search className="size-4 md:size-5" strokeWidth={1.5} />
        </button>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} hideTrigger />

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput
          value={query}
          onValueChange={(v) => setQuery(v)}
          placeholder="Rechercher une page ou une commande..."
        />
        <CommandList>
          <CommandEmpty>Aucune commande trouvée.</CommandEmpty>
          <CommandGroup heading="Actions">
            {filtered.map((c) => {
              const Icon = c.icon;
              return (
                <CommandItem
                  key={c.to}
                  onSelect={() => {
                    go(c.to);
                  }}
                >
                  <Icon className="mr-2 size-4" />
                  {c.label}
                  <span className="ml-auto text-xs text-muted-foreground">{c.group}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
