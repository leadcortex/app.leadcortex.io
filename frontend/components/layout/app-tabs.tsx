// frontend/components/layout/app-tabs.tsx

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
import { useRouter, useRouterState } from "@tanstack/react-router";
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
  LayoutGrid,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Send,
  Settings,
  Briefcase,
  Users,
  Layers,
  Workflow,
  X,
  GraduationCap,
} from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import { isPreviewFrame } from "@/lib/core/persist";
import { TabPreviewCard, type TabPreviewSnapshot } from "@/components/layout/tab-preview";
import { CAPTURE_ATTR, captureTabViewport } from "@/lib/tabs/tab-capture";
import {
  forgetScroll,
  getSavedScroll,
  getScroller,
  pruneScroll,
  restoreScrollWhenReady,
  trackScroll,
} from "@/lib/tabs/tab-scroll";

const ICONS = {
  dashboard: LayoutDashboard,
  hub: LayoutGrid,
  users: Users,
  building: Building2,
  list: ListChecks,
  wand: Layers,
  send: Send,
  mail: Mail,
  phone: Phone,
  check: CheckSquare,
  calendar: CalendarDays,
  message: MessageSquare,
  target: Briefcase,
  workflow: Workflow,
  chart: BarChart3,
  eye: Eye,
  fileInput: FileInput,
  bookmark: Bookmark,
  settings: Settings,
  creditCard: CreditCard,
  file: FileText,
  graduationCap: GraduationCap,
} as const;

type IconKey = keyof typeof ICONS;

type TabMeta = { label: string; iconKey: IconKey };

const STATIC_ROUTES: Record<string, TabMeta> = {
  "/app": { label: "Dashboard", iconKey: "dashboard" },
  "/app/hub": { label: "Hub", iconKey: "hub" },
  "/app/academy": { label: "Academy", iconKey: "graduationCap" },
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
  href?: string;
  label: string;
  iconKey: IconKey;

  context: Record<string, unknown>;
};

type TabState = { tabs: AppTab[]; activeId: string | null };

type TabContextValue = TabState & {
  navigateInActiveTab: (path: string) => void;
  createTab: (path?: string) => void;
  capacity: number;
  setCapacity: (n: number) => void;
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
const TabPreviewContext = createContext<Record<string, TabPreviewSnapshot>>({});

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

function makeTab(path: string, href: string = path): AppTab {
  const meta = resolveTabMeta(path);
  return { id: newId(), path, href, label: meta.label, iconKey: meta.iconKey, context: {} };
}

const STORAGE_KEY = "leadcortex.app-tabs.v4";
const LEGACY_STORAGE_KEY = "leadcortex.app-tabs.v3";
const HARD_MAX_TABS = 5;
const TAB_MAX_W = 200;
const TAB_LABEL_MIN_W = 88;
const TAB_GAP = 4;
const PREVIEW_DELAY_MS = 350;
const PLUS_W = 32;
const CAPTURE_SETTLE_MAX_MS = 5000;
const CAPTURE_QUIET_MS = 500;
const CAPTURE_MIN_MS = 700;
const CAPTURE_IDLE_DELAY_MS = 700;

function waitForCaptureReady(isCancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    let lastMutation = startedAt;
    const root =
      document.querySelector<HTMLElement>(`[${CAPTURE_ATTR}]`) ??
      document.querySelector<HTMLElement>("main") ??
      document.body;
    const observer = new MutationObserver(() => {
      lastMutation = performance.now();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    const check = () => {
      const now = performance.now();
      const loading = !!root.querySelector(".animate-pulse, [aria-busy='true']");
      if (
        isCancelled() ||
        now - startedAt >= CAPTURE_SETTLE_MAX_MS ||
        (!loading && now - lastMutation >= CAPTURE_QUIET_MS && now - startedAt >= CAPTURE_MIN_MS)
      ) {
        observer.disconnect();
        resolve();
        return;
      }
      window.setTimeout(check, 120);
    };

    check();
  });
}

function scheduleCaptureWhenIdle(callback: () => void): () => void {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  let cancelled = false;
  let started = false;
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const removeActivityListeners = () => {
    document.removeEventListener("pointerdown", onActivity, true);
    document.removeEventListener("keydown", onActivity, true);
    document.removeEventListener("wheel", onActivity, true);
    document.removeEventListener("touchstart", onActivity, true);
  };

  const cancelScheduled = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (idleId !== null) {
      idleWindow.cancelIdleCallback?.(idleId);
      idleId = null;
    }
  };

  const run = () => {
    idleId = null;
    if (cancelled || started) return;
    started = true;
    removeActivityListeners();
    callback();
  };

  const start = () => {
    timeoutId = null;
    if (cancelled) return;
    if (document.visibilityState !== "visible") {
      timeoutId = window.setTimeout(start, CAPTURE_IDLE_DELAY_MS);
      return;
    }
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(run, { timeout: 2000 });
    } else {
      run();
    }
  };

  const onActivity = () => {
    if (started) return;
    cancelScheduled();
    timeoutId = window.setTimeout(start, CAPTURE_IDLE_DELAY_MS);
  };

  document.addEventListener("pointerdown", onActivity, true);
  document.addEventListener("keydown", onActivity, true);
  document.addEventListener("wheel", onActivity, { capture: true, passive: true });
  document.addEventListener("touchstart", onActivity, { capture: true, passive: true });
  timeoutId = window.setTimeout(start, CAPTURE_IDLE_DELAY_MS);

  return () => {
    cancelled = true;
    cancelScheduled();
    removeActivityListeners();
  };
}

export function sectionRoot(path: string): string {
  const seg = path.split("?")[0]!.split("#")[0]!.split("/").filter(Boolean);
  if (seg[0] !== "app" || seg.length <= 1) return "/app";
  return `/${seg[0]}/${seg[1]}`;
}

function parsePersisted(raw: string | null): TabState | null {
  if (!raw) return null;
  try {
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
        href: typeof t.href === "string" && t.href.startsWith("/app") ? t.href : t.path,
        context:
          t.context && typeof t.context === "object" && !Array.isArray(t.context)
            ? (t.context as Record<string, unknown>)
            : {},
      }));
    tabs.splice(HARD_MAX_TABS);
    const activeId =
      typeof parsed.activeId === "string" && tabs.some((t) => t.id === parsed.activeId)
        ? parsed.activeId
        : (tabs[0]?.id ?? null);
    return { tabs, activeId };
  } catch {
    return null;
  }
}

function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function loadPersisted(): TabState | null {
  if (typeof window === "undefined") return null;
  return (
    parsePersisted(readStorage(() => window.sessionStorage, STORAGE_KEY)) ??
    parsePersisted(readStorage(() => window.localStorage, STORAGE_KEY)) ??
    parsePersisted(readStorage(() => window.sessionStorage, LEGACY_STORAGE_KEY))
  );
}

const WORKFLOW_EDITOR_RE = /^\/app\/workflows\/[^/]+$/;

export function TabProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const href = useRouterState({ select: (r) => r.location.href });
  const router = useRouter();

  const [state, setState] = useState<TabState>(() => {
    const inApp = pathname.startsWith("/app");
    const tab = makeTab(inApp ? pathname : "/app", inApp ? href : "/app");
    return { tabs: [tab], activeId: tab.id };
  });
  const [previews, setPreviews] = useState<Record<string, TabPreviewSnapshot>>({});
  const [tabsHydrated, setTabsHydrated] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [capacity, setCapacityState] = useState(HARD_MAX_TABS);
  const setCapacity = useCallback(
    (n: number) => setCapacityState((prev) => (prev === n ? prev : n)),
    [],
  );

  const current = useRef({ id: state.activeId, href });
  useEffect(() => {
    current.current = { id: state.activeId, href };
  }, [state.activeId, href]);

  useEffect(() => {
    setPreviews((prev) => {
      let next: Record<string, TabPreviewSnapshot> | null = null;
      for (const id of Object.keys(prev)) {
        if (!state.tabs.some((tab) => tab.id === id)) {
          next ??= { ...prev };
          delete next[id];
        }
      }
      return next ?? prev;
    });
  }, [state.tabs]);

  useEffect(() => {
    if (!tabsHydrated || restoring || !state.activeId || isPreviewFrame()) return;
    const tabId = state.activeId;
    let cancelled = false;

    let cancelScheduledCapture: (() => void) | null = null;
    void waitForCaptureReady(() => cancelled).then(() => {
      if (cancelled) return;
      cancelScheduledCapture = scheduleCaptureWhenIdle(() => {
        void captureTabViewport(5000).then(
          (dataUrl) => {
            if (!cancelled) {
              setPreviews((prev) => ({ ...prev, [tabId]: { dataUrl, error: false } }));
            }
          },
          () => {
            if (!cancelled) {
              setPreviews((prev) => ({ ...prev, [tabId]: { dataUrl: null, error: true } }));
            }
          },
        );
      });
    });

    return () => {
      cancelled = true;
      cancelScheduledCapture?.();
    };
  }, [href, pathname, restoring, state.activeId, tabsHydrated]);

  useEffect(() => {
    if (isPreviewFrame()) {
      setTabsHydrated(true);
      return;
    }
    const persisted = loadPersisted();
    if (persisted?.tabs.length) {
      setState(persisted);
      pruneScroll(persisted.tabs.map((t) => t.id));
      const active = persisted.tabs.find((t) => t.id === persisted.activeId);
      const landing = pathname === "/app" || pathname === "/app/";
      if (active && landing && active.path !== "/app") {
        setRestoring(active.path);
        router.history.replace(active.href ?? active.path);
      }
    }
    setTabsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restoring) return;
    if (pathname === restoring) {
      setRestoring(null);
      return;
    }
    const t = window.setTimeout(() => setRestoring(null), 4000);
    return () => window.clearTimeout(t);
  }, [restoring, pathname]);

  useEffect(() => {
    if (!tabsHydrated || isPreviewFrame()) return;
    const json = JSON.stringify(state);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, json);
    } catch {
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
    } catch {
    }
  }, [state, tabsHydrated]);

  useEffect(() => {
    if (!tabsHydrated || restoring || !pathname.startsWith("/app")) return;
    setState((prev) => {
      if (prev.tabs.length === 0) {
        const tab = makeTab(pathname, href);
        return { tabs: [tab], activeId: tab.id };
      }
      const activeId = prev.activeId ?? prev.tabs[0]!.id;
      const active = prev.tabs.find((t) => t.id === activeId);
      if (!active) {
        const tab = makeTab(pathname, href);
        if (prev.tabs.length >= HARD_MAX_TABS) {
          return {
            tabs: prev.tabs.map((t, i) => (i === prev.tabs.length - 1 ? tab : t)),
            activeId: tab.id,
          };
        }
        return { tabs: [...prev.tabs, tab], activeId: tab.id };
      }
      if (active.path === pathname) {
        if ((active.href ?? active.path) === href) return prev;
        return {
          ...prev,
          activeId,
          tabs: prev.tabs.map((t) => (t.id === activeId ? { ...t, href } : t)),
        };
      }

      const isWorkflowEditor = WORKFLOW_EDITOR_RE.test(pathname);
      const activeIsWorkflowEditor = WORKFLOW_EDITOR_RE.test(active.path);
      if (isWorkflowEditor && !activeIsWorkflowEditor) {
        const existing = prev.tabs.find((t) => t.path === pathname);
        if (existing) return { ...prev, activeId: existing.id };
        const tab = makeTab(pathname, href);
        if (prev.tabs.length >= HARD_MAX_TABS) {
          return {
            tabs: prev.tabs.map((t) => (t.id === activeId ? tab : t)),
            activeId: tab.id,
          };
        }
        return { tabs: [...prev.tabs, tab], activeId: tab.id };
      }

      const meta = resolveTabMeta(pathname);
      return {
        ...prev,
        activeId,
        tabs: prev.tabs.map((t) =>
          t.id === activeId
            ? { ...t, path: pathname, href, label: meta.label, iconKey: meta.iconKey }
            : t,
        ),
      };
    });
  }, [pathname, href, tabsHydrated, restoring]);

  const stopRestore = useRef<(() => void) | null>(null);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPreviewFrame()) return;
    return trackScroll(() => current.current);
  }, []);

  useEffect(() => () => stopRestore.current?.(), []);

  useEffect(() => {
    if (!tabsHydrated || restoring || isPreviewFrame()) return;
    const { id, href: where } = current.current;
    if (!id) return;
    const first = lastPathRef.current === null;
    if (!first && lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    stopRestore.current?.();
    const y = getSavedScroll(id, where);
    if (y) {
      stopRestore.current = restoreScrollWhenReady(y);
    } else if (!first && !where.includes("#")) {
      getScroller()?.scrollTo({ top: 0 });
    }
  }, [tabsHydrated, restoring, pathname]);

  const navigateInActiveTab = useCallback(
    (path: string) => {
      router.history.push(path);
    },
    [router],
  );

  const tabCount = state.tabs.length;
  const createTab = useCallback(
    (path?: string) => {
      const target = path ?? sectionRoot(pathname);
      if (tabCount >= capacity) {
        toast.info(`Limite atteinte : ${capacity} onglet${capacity > 1 ? "s" : ""} maximum`, {
          description: "Fermez un onglet ou agrandissez la fenêtre pour en ouvrir d'autres.",
        });
        return;
      }
      const tab = makeTab(target);
      setState((prev) => {
        if (prev.tabs.length >= HARD_MAX_TABS) return prev;
        return { tabs: [...prev.tabs, tab], activeId: tab.id };
      });
      if (target !== pathname) router.history.push(target);
    },
    [router, pathname, tabCount, capacity],
  );

  const closeTab = useCallback(
    (id: string) => {
      forgetScroll(id);
      setPreviews((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setState((prev) => {
        const idx = prev.tabs.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        const next = prev.tabs.filter((t) => t.id !== id);

        if (next.length === 0) {
          const tab = makeTab("/app");
          queueMicrotask(() => router.history.push("/app"));
          return { tabs: [tab], activeId: tab.id };
        }

        if (prev.activeId !== id) {
          return { tabs: next, activeId: prev.activeId };
        }

        const neighbour = next[Math.max(0, idx - 1)] ?? next[0]!;
        queueMicrotask(() => router.history.push(neighbour.href ?? neighbour.path));
        return { tabs: next, activeId: neighbour.id };
      });
    },
    [router],
  );

  const closeOtherTabs = useCallback(
    (id: string) => {
      setPreviews((prev) => {
        const kept = prev[id];
        return kept ? { [id]: kept } : {};
      });
      setState((prev) => {
        const keep = prev.tabs.find((t) => t.id === id);
        if (!keep) return prev;
        const target = keep.href ?? keep.path;
        if (target !== href) queueMicrotask(() => router.history.push(target));
        return { tabs: [keep], activeId: keep.id };
      });
    },
    [router, href],
  );

  const closeAllTabs = useCallback(() => {
    setPreviews({});
    const tab = makeTab("/app");
    setState({ tabs: [tab], activeId: tab.id });
    router.history.push("/app");
  }, [router]);

  const setActive = useCallback(
    (id: string) => {
      setState((prev) => {
        if (prev.activeId === id) return prev;
        const tab = prev.tabs.find((t) => t.id === id);
        if (!tab) return prev;
        const target = tab.href ?? tab.path;
        if (target !== href) {
          queueMicrotask(() => {
            router.history.push(target);
            if (tab.path === pathname) {
              stopRestore.current?.();
              stopRestore.current = restoreScrollWhenReady(getSavedScroll(tab.id, target) ?? 0);
            }
          });
        }
        return { ...prev, activeId: id };
      });
    },
    [router, href, pathname],
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
      capacity,
      setCapacity,
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
      capacity,
      setCapacity,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setActive,
      reorder,
      updateTabContext,
    ],
  );

  return (
    <TabContext.Provider value={value}>
      <TabPreviewContext.Provider value={previews}>{children}</TabPreviewContext.Provider>
    </TabContext.Provider>
  );
}

export function AppTabs() {
  const { tabs, activeId, setActive, closeTab, createTab, reorder, capacity, setCapacity } =
    useTabs();
  const previews = useContext(TabPreviewContext);

  const listRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number") setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const count = tabs.length;
  const fitCapacity =
    width > 0
      ? Math.max(
          1,
          Math.min(HARD_MAX_TABS, Math.floor((width - PLUS_W) / (TAB_LABEL_MIN_W + TAB_GAP))),
        )
      : HARD_MAX_TABS;

  useEffect(() => {
    setCapacity(fitCapacity);
  }, [fitCapacity, setCapacity]);

  const tabWidth =
    width > 0 && count > 0
      ? Math.floor(
          Math.min(
            TAB_MAX_W,
            Math.max(TAB_LABEL_MIN_W, (width - PLUS_W - count * TAB_GAP) / count),
          ),
        )
      : TAB_MAX_W;
  const atLimit = count >= capacity;

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
    }, PREVIEW_DELAY_MS);
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
    cancelPreview();
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
        ref={listRef}
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
              style={{ width: tabWidth }}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onMouseEnter={(e) => {
                if (!isActive) schedulePreview(tab, e.currentTarget);
              }}
              onMouseLeave={cancelPreview}
              onClick={() => {
                cancelPreview();
                if (!isActive) setActive(tab.id);
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              className={cn(
                "group relative flex h-8 shrink-0 cursor-pointer items-center rounded-lg border text-xs select-none transition-[width,background-color,color,box-shadow] duration-150",
                "gap-1.5 px-2",
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
                  "grid shrink-0 place-items-center rounded transition-colors",
                  "size-4",
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
          onClick={() => createTab()}
          aria-label="Nouvel onglet"
          aria-disabled={atLimit}
          title={
            atLimit
              ? `Limite atteinte (${capacity} onglet${capacity > 1 ? "s" : ""})`
              : "Nouvel onglet (dans la section actuelle)"
          }
          className={cn(
            "ml-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors",
            atLimit ? "cursor-not-allowed opacity-40" : "hover:bg-surface hover:text-foreground",
          )}
        >
          <Plus className="size-4" strokeWidth={1.9} />
        </button>
      </div>

      {preview && preview.tab.id !== activeId && (
        <TabPreviewCard
          key={preview.tab.id}
          tab={preview.tab}
          rect={preview.rect}
          Icon={ICONS[preview.tab.iconKey] ?? FileText}
          snapshot={previews[preview.tab.id]}
        />
      )}
    </div>
  );
}
