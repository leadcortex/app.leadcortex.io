//frontend\components\app-tabs.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bookmark,
  Building2,
  CalendarDays,
  CheckSquare,
  CreditCard,
  Eye,
  FileInput,
  FileText,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Send,
  Settings,
  Target,
  Users,
  Wand2,
  Workflow,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  building: Building2,
  list: ListChecks,
  wand: Wand2,
  send: Send,
  mail: Mail,
  phone: Phone,
  check: CheckSquare,
  calendar: CalendarDays,
  message: MessageSquare,
  target: Target,
  workflow: Workflow,
  chart: BarChart3,
  eye: Eye,
  fileInput: FileInput,
  bookmark: Bookmark,
  settings: Settings,
  creditCard: CreditCard,
  file: FileText,
} as const;

type IconKey = keyof typeof ICONS;

type TabMeta = { label: string; iconKey: IconKey };

const STATIC_ROUTES: Record<string, TabMeta> = {
  "/app": { label: "Dashboard", iconKey: "dashboard" },
  "/app/people": { label: "Prospects", iconKey: "users" },
  "/app/people/new": { label: "Nouveau prospect", iconKey: "users" },
  "/app/companies": { label: "Entreprises", iconKey: "building" },
  "/app/companies/new": { label: "Nouvelle entreprise", iconKey: "building" },
  "/app/lists": { label: "Listes", iconKey: "list" },
  "/app/enrichment": { label: "Enrichissement", iconKey: "wand" },
  "/app/sequences": { label: "Séquences", iconKey: "send" },
  "/app/sequences/new": { label: "Nouvelle séquence", iconKey: "send" },
  "/app/emails": { label: "Emails", iconKey: "mail" },
  "/app/calls": { label: "Appels", iconKey: "phone" },
  "/app/tasks": { label: "Tâches", iconKey: "check" },
  "/app/meetings": { label: "Meetings", iconKey: "calendar" },
  "/app/conversations": { label: "Conversations", iconKey: "message" },
  "/app/deals": { label: "Opportunités", iconKey: "target" },
  "/app/workflows": { label: "Workflows", iconKey: "workflow" },
  "/app/workflows/new": { label: "Nouveau workflow", iconKey: "workflow" },
  "/app/analytics": { label: "Analyses", iconKey: "chart" },
  "/app/visitors": { label: "Visiteurs", iconKey: "eye" },
  "/app/forms": { label: "Formulaires", iconKey: "fileInput" },
  "/app/saved": { label: "Sauvegardés", iconKey: "bookmark" },
  "/app/settings": { label: "Paramètres", iconKey: "settings" },
  "/app/settings/billing": { label: "Facturation", iconKey: "creditCard" },
};

function resolveTabMeta(pathname: string): TabMeta {
  if (STATIC_ROUTES[pathname]) return STATIC_ROUTES[pathname];
  if (/^\/app\/people\/[^/]+$/.test(pathname)) return { label: "Prospect", iconKey: "users" };
  if (/^\/app\/companies\/[^/]+$/.test(pathname))
    return { label: "Entreprise", iconKey: "building" };
  if (/^\/app\/deals\/[^/]+$/.test(pathname)) return { label: "Opportunité", iconKey: "target" };
  if (/^\/app\/sequences\/[^/]+$/.test(pathname)) return { label: "Séquence", iconKey: "send" };
  if (/^\/app\/tasks\/[^/]+$/.test(pathname)) return { label: "Tâche", iconKey: "check" };
  if (/^\/app\/workflows\/[^/]+$/.test(pathname)) return { label: "Workflow", iconKey: "workflow" };
  return { label: "Page", iconKey: "file" };
}

export type AppTab = {
  id: string;
  path: string;
  label: string;
  iconKey: IconKey;

  context: Record<string, unknown>;
};

type TabState = { tabs: AppTab[]; activeId: string | null };

type TabContextValue = TabState & {
  navigateInActiveTab: (path: string) => void;
  createTab: (path?: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  setActive: (id: string) => void;
  reorder: (fromId: string, toId: string) => void;

  updateTabContext: (
    id: string,
    key: string,
    value: unknown | ((prev: unknown) => unknown),
  ) => void;
};

const TabContext = createContext<TabContextValue | null>(null);

export function useTabs(): TabContextValue {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTabs doit être utilisé dans <TabProvider>.");
  return ctx;
}

export function useTabContextValue<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const { tabs, activeId, updateTabContext } = useTabs();
  const active = tabs.find((t) => t.id === activeId) ?? null;

  const raw = active?.context?.[key];
  const value = (raw === undefined ? defaultValue : raw) as T;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (!activeId) return;
      updateTabContext(activeId, key, next as unknown);
    },
    [activeId, key, updateTabContext],
  );

  return [value, setValue];
}

function newId() {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeTab(path: string): AppTab {
  const meta = resolveTabMeta(path);
  return { id: newId(), path, label: meta.label, iconKey: meta.iconKey, context: {} };
}

/* -------------------------------------------------------------------------- */
/*  Persistance                                                               */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "leadcortex.app-tabs.v3";
const MAX_TABS = 15;

function loadPersisted(): TabState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TabState;
    if (!Array.isArray(parsed?.tabs)) return null;
    const tabs = parsed.tabs
      .filter(
        (t): t is AppTab =>
          !!t &&
          typeof t.id === "string" &&
          typeof t.path === "string" &&
          typeof t.label === "string" &&
          typeof t.iconKey === "string" &&
          (t.iconKey as string) in ICONS,
      )
      .map((t) => ({
        ...t,
        context:
          t.context && typeof t.context === "object" && !Array.isArray(t.context)
            ? (t.context as Record<string, unknown>)
            : {},
      }));
    const activeId =
      typeof parsed.activeId === "string" && tabs.some((t) => t.id === parsed.activeId)
        ? parsed.activeId
        : (tabs[0]?.id ?? null);
    return { tabs, activeId };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

const WORKFLOW_EDITOR_RE = /^\/app\/workflows\/[^/]+$/;

export function TabProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const [state, setState] = useState<TabState>(() => {
    const persisted = loadPersisted();
    if (persisted && persisted.tabs.length > 0) return persisted;
    const initialPath = pathname.startsWith("/app") ? pathname : "/app";
    const tab = makeTab(initialPath);
    return { tabs: [tab], activeId: tab.id };
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    if (!pathname.startsWith("/app")) return;
    setState((prev) => {
      if (prev.tabs.length === 0) {
        const tab = makeTab(pathname);
        return { tabs: [tab], activeId: tab.id };
      }
      const activeId = prev.activeId ?? prev.tabs[0]!.id;
      const active = prev.tabs.find((t) => t.id === activeId);
      if (!active) {
        const tab = makeTab(pathname);
        return { tabs: [...prev.tabs, tab], activeId: tab.id };
      }
      if (active.path === pathname) return prev;

      const isWorkflowEditor = WORKFLOW_EDITOR_RE.test(pathname);
      const activeIsWorkflowEditor = WORKFLOW_EDITOR_RE.test(active.path);
      if (isWorkflowEditor && !activeIsWorkflowEditor) {
        const existing = prev.tabs.find((t) => t.path === pathname);
        if (existing) return { ...prev, activeId: existing.id };
        const tab = makeTab(pathname);
        return { tabs: [...prev.tabs, tab], activeId: tab.id };
      }

      const meta = resolveTabMeta(pathname);
      return {
        ...prev,
        activeId,
        tabs: prev.tabs.map((t) =>
          t.id === activeId
            ? { ...t, path: pathname, label: meta.label, iconKey: meta.iconKey }
            : t,
        ),
      };
    });
  }, [pathname]);

  const navigateInActiveTab = useCallback(
    (path: string) => {
      navigate({ to: path as any });
    },
    [navigate],
  );

  const createTab = useCallback(
    (path = "/app") => {
      setState((prev) => {
        const tab = makeTab(path);
        const next = [...prev.tabs, tab];
        const trimmed = next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next;
        return { tabs: trimmed, activeId: tab.id };
      });
      if (path !== pathname) navigate({ to: path as any });
    },
    [navigate, pathname],
  );

  const closeTab = useCallback(
    (id: string) => {
      setState((prev) => {
        const idx = prev.tabs.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        const next = prev.tabs.filter((t) => t.id !== id);

        if (next.length === 0) {
          const tab = makeTab("/app");
          queueMicrotask(() => navigate({ to: "/app" as any }));
          return { tabs: [tab], activeId: tab.id };
        }

        if (prev.activeId !== id) {
          return { tabs: next, activeId: prev.activeId };
        }

        const neighbour = next[Math.max(0, idx - 1)] ?? next[0]!;
        queueMicrotask(() => navigate({ to: neighbour.path as any }));
        return { tabs: next, activeId: neighbour.id };
      });
    },
    [navigate],
  );

  const closeOtherTabs = useCallback(
    (id: string) => {
      setState((prev) => {
        const keep = prev.tabs.find((t) => t.id === id);
        if (!keep) return prev;
        if (keep.path !== pathname) queueMicrotask(() => navigate({ to: keep.path as any }));
        return { tabs: [keep], activeId: keep.id };
      });
    },
    [navigate, pathname],
  );

  const closeAllTabs = useCallback(() => {
    const tab = makeTab("/app");
    setState({ tabs: [tab], activeId: tab.id });
    navigate({ to: "/app" as any });
  }, [navigate]);

  const setActive = useCallback(
    (id: string) => {
      setState((prev) => {
        if (prev.activeId === id) return prev;
        const tab = prev.tabs.find((t) => t.id === id);
        if (!tab) return prev;
        if (tab.path !== pathname) queueMicrotask(() => navigate({ to: tab.path as any }));
        return { ...prev, activeId: id };
      });
    },
    [navigate, pathname],
  );

  const reorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setState((prev) => {
      const fromIdx = prev.tabs.findIndex((t) => t.id === fromId);
      const toIdx = prev.tabs.findIndex((t) => t.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev.tabs];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved!);
      return { ...prev, tabs: next };
    });
  }, []);

  const updateTabContext = useCallback(
    (id: string, key: string, value: unknown | ((prev: unknown) => unknown)) => {
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.map((t) => {
          if (t.id !== id) return t;
          const current = t.context?.[key];
          const next =
            typeof value === "function" ? (value as (p: unknown) => unknown)(current) : value;
          return { ...t, context: { ...t.context, [key]: next } };
        }),
      }));
    },
    [],
  );

  const value = useMemo<TabContextValue>(
    () => ({
      ...state,
      navigateInActiveTab,
      createTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setActive,
      reorder,
      updateTabContext,
    }),
    [
      state,
      navigateInActiveTab,
      createTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setActive,
      reorder,
      updateTabContext,
    ],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*  UI : barre d'onglets + bouton +                                           */
/* -------------------------------------------------------------------------- */

export function AppTabs() {
  const { tabs, activeId, setActive, closeTab, createTab, reorder } = useTabs();

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [preview, setPreview] = useState<{
    tab: AppTab;
    rect: { top: number; left: number; bottom: number; width: number };
  } | null>(null);
  const previewTimer = useRef<number | null>(null);

  const schedulePreview = useCallback((tab: AppTab, el: HTMLDivElement) => {
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setPreview({
        tab,
        rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
      });
    }, 280);
  }, []);

  const cancelPreview = useCallback(() => {
    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setPreview(null);
  }, []);

  useEffect(() => () => cancelPreview(), [cancelPreview]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dropTargetId) setDropTargetId(id);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    const from = dragId ?? e.dataTransfer.getData("text/plain");
    setDragId(null);
    setDropTargetId(null);
    if (!from) return;
    reorder(from, id);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropTargetId(null);
  };

  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-1">
      <div
        role="tablist"
        aria-label="Onglets de navigation"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => {
          const Icon = ICONS[tab.iconKey] ?? FileText;
          const isActive = tab.id === activeId;
          const isDragging = dragId === tab.id;
          const isDropTarget = dropTargetId === tab.id && dragId && dragId !== tab.id;

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              draggable
              title={tab.label}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onMouseEnter={(e) => schedulePreview(tab, e.currentTarget)}
              onMouseLeave={cancelPreview}
              onClick={() => {
                if (!isActive) setActive(tab.id);
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              className={cn(
                "group relative flex h-8 max-w-[200px] min-w-[120px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-xs select-none transition-all",
                isActive
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                isDragging && "opacity-40",
                isDropTarget && "ring-2 ring-primary/60 ring-offset-1 ring-offset-background",
              )}
            >
              <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate">{tab.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelPreview();
                  closeTab(tab.id);
                }}
                aria-label={`Fermer l'onglet ${tab.label}`}
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded transition-colors",
                  isActive
                    ? "text-muted-foreground hover:bg-surface hover:text-foreground"
                    : "text-transparent group-hover:text-muted-foreground hover:!text-foreground hover:bg-surface",
                )}
              >
                <X className="size-3" strokeWidth={2.25} />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => createTab("/app")}
          aria-label="Nouvel onglet"
          title="Nouvel onglet"
          className="ml-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <Plus className="size-4" strokeWidth={1.9} />
        </button>
      </div>

      {preview && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            top: preview.rect.bottom + 8,
            left: Math.max(8, Math.min(preview.rect.left, window.innerWidth - 296)),
            width: 288,
          }}
          className="z-[100] overflow-hidden rounded-xl border border-border bg-background p-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = ICONS[preview.tab.iconKey] ?? FileText;
              return <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.8} />;
            })()}
            <p className="min-w-0 flex-1 truncate text-xs font-medium">{preview.tab.label}</p>
          </div>
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            {preview.tab.path}
          </p>

          <div className="mt-2 overflow-hidden rounded-lg border border-border/60 bg-surface/40 p-2">
            <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5">
              <span className="size-2 rounded-full bg-red-400/70" />
              <span className="size-2 rounded-full bg-yellow-400/70" />
              <span className="size-2 rounded-full bg-green-400/70" />
              <span className="ml-1.5 h-1.5 flex-1 rounded-full bg-border/60" />
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 w-3/5 rounded bg-border/60" />
              <div className="h-2 w-2/5 rounded bg-border/40" />
              <div className="mt-3 flex gap-1.5">
                <div className="h-7 flex-1 rounded bg-border/30" />
                <div className="h-7 flex-1 rounded bg-border/30" />
                <div className="h-7 flex-1 rounded bg-border/30" />
              </div>
              <div className="h-2 w-full rounded bg-border/40" />
              <div className="h-2 w-5/6 rounded bg-border/40" />
              <div className="h-2 w-4/5 rounded bg-border/40" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
