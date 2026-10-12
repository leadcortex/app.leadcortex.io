//frontend\lib\store.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Lead,
  Company,
  Task,
  Deal,
  Email,
  Meeting,
  Conversation,
  Workflow,
  FormItem,
  ListItem,
  Visitor,
  CallItem,
} from "./mock-data";

export type SequenceStep = {
  id: string;
  type: "email" | "linkedin" | "call";
  subject?: string;
  content: string;
  delay: number;
};

export type SequenceSettings = {
  dailyLimit: number;
  sendWindowStart: string;
  sendWindowEnd: string;
  sendDays: string[];
  timezone: string;
  stopOnReply: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  priority: "low" | "normal" | "high";
};

export type Sequence = {
  id: string;
  name: string;
  steps: number;
  leads: number;
  opens: string;
  replies: string;
  status: "active" | "paused" | "draft";
  description?: string;
  objective?: string;
  audience?: string;
  tags?: string[];
  stepsDetail?: SequenceStep[];
  settings?: SequenceSettings;
  createdAt?: string;
};

export const DEFAULT_SEQUENCE_SETTINGS: SequenceSettings = {
  dailyLimit: 50,
  sendWindowStart: "09:00",
  sendWindowEnd: "18:00",
  sendDays: ["Lun", "Mar", "Mer", "Jeu", "Ven"],
  timezone: "Europe/Paris",
  stopOnReply: true,
  trackOpens: true,
  trackClicks: true,
  priority: "normal",
};

export type SequenceCreateInput = {
  name: string;
  description?: string;
  objective?: string;
  audience?: string;
  tags?: string[];
  status?: Sequence["status"];
  stepsDetail: SequenceStep[];
  settings?: SequenceSettings;
};

type State = {
  version: number;
  user: { name: string | null; email: string | null };
  leads: Lead[];
  companies: Company[];
  tasks: Task[];
  sequences: Sequence[];
  workflows: Workflow[];
  deals: Deal[];
  emails: Email[];
  meetings: Meeting[];
  conversations: Conversation[];
  forms: FormItem[];
  lists: ListItem[];
  visitors: Visitor[];
  calls: CallItem[];
  activity: { id: string; label: string; detail: string; status: string; time: string }[];
  notifications: { id: string; label: string; time: string; read: boolean }[];
  syncStatus: "idle" | "syncing" | "synced" | "error";
};

type Actions = {
  setUser: (email: string) => void;
  toggleTask: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "done">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;
  toggleLeadSaved: (id: string) => void;
  addLead: (l: Omit<Lead, "id"> & { id?: string }) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  toggleCompanySaved: (id: string) => void;
  addCompany: (c: Omit<Company, "id"> & { id?: string }) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addSequence: (s: SequenceCreateInput) => Sequence;
  updateSequence: (id: string, patch: Partial<Sequence>) => void;
  deleteSequence: (id: string) => void;
  duplicateSequence: (id: string) => void;
  toggleSequenceStatus: (id: string) => void;

  toggleWorkflowStatus: (id: string) => void;
  advanceDealStage: (id: string) => void;
  addDeal: (d: Omit<Deal, "id">) => void;
  markEmailRead: (id: string) => void;
  markAllEmailsRead: () => void;
  addActivity: (label: string, detail: string) => void;
  markNotificationsRead: () => void;
  addList: (name: string, type: "people" | "company") => void;
  deleteList: (id: string) => void;
  toggleFormStatus: (id: string) => void;
  addWorkflow: (w: Workflow) => void;
  duplicateWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  reset: () => void;
  syncData: () => Promise<void>;
  setSyncStatus: (status: State["syncStatus"]) => void;
  setLeads: (leads: Lead[]) => void;
  setCompanies: (companies: Company[]) => void;
};

const STORAGE_KEY = "leadcortex-state-v1";
const CURRENT_VERSION = 2;

const initialState: State = {
  version: CURRENT_VERSION,
  user: { name: null, email: null },
  leads: [],
  companies: [],
  tasks: [],
  sequences: [],
  workflows: [],
  deals: [],
  emails: [],
  meetings: [],
  conversations: [],
  forms: [],
  lists: [],
  visitors: [],
  calls: [],
  activity: [],
  notifications: [
    {
      id: "n1",
      label: "Bienvenue sur LeadCortex 🚀",
      time: "à l'instant",
      read: false,
    },
  ],
  syncStatus: "idle",
};

type Runtime = {
  hydrated: boolean;
};

const Ctx = createContext<(State & Actions & Runtime) | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === CURRENT_VERSION) {
          setState((s) => ({ ...s, ...parsed }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setState(initialState);
        }
      }
    } catch {
      // En cas d'erreur, on reste sur l'état initial
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Intentionally ignored. */
    }
  }, [state, hydrated]);

  const update = useCallback(
    <K extends keyof State>(k: K, v: State[K] | ((prev: State[K]) => State[K])) => {
      setState((s) => ({
        ...s,
        [k]: typeof v === "function" ? (v as (p: State[K]) => State[K])(s[k]) : v,
      }));
    },
    [],
  );

  const setUser = useCallback((email: string) => {
    const name = email.split("@")[0];
    const capitalized = name
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    setState((s) => ({ ...s, user: { name: capitalized || email, email } }));
  }, []);

  const addActivity: Actions["addActivity"] = useCallback((label, detail) => {
    setState((s) => ({
      ...s,
      activity: [
        { id: `a${Date.now()}`, label, detail, status: "active" as const, time: "à l'instant" },
        ...s.activity,
      ].slice(0, 12),
    }));
  }, []);

  // --- Synchronisation ---
  const syncData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, syncStatus: "syncing" }));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setState((s) => ({ ...s, syncStatus: "synced" }));
      setTimeout(() => {
        setState((s) => ({ ...s, syncStatus: "idle" }));
      }, 3000);
    } catch {
      setState((s) => ({ ...s, syncStatus: "error" }));
      setTimeout(() => {
        setState((s) => ({ ...s, syncStatus: "idle" }));
      }, 5000);
    }
  }, []);

  const setSyncStatus = useCallback((status: State["syncStatus"]) => {
    setState((s) => ({ ...s, syncStatus: status }));
  }, []);

  // Synchronisation périodique
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(
      () => {
        if (state.syncStatus === "idle") syncData();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [hydrated, state.syncStatus, syncData]);

  // --- Actions métier ---
  const actions: Actions = useMemo(
    () => ({
      setUser,
      toggleTask: (id) =>
        update("tasks", (ts) =>
          ts.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                  status: !t.done ? "done" : t.status === "done" ? "todo" : (t.status ?? "todo"),
                  completedAt: !t.done ? new Date().toISOString() : undefined,
                }
              : t,
          ),
        ),
      addTask: (t) => update("tasks", (ts) => [{ id: `t${Date.now()}`, done: false, ...t }, ...ts]),
      updateTask: (id, patch) =>
        update("tasks", (ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      toggleSubtask: (taskId, subtaskId) =>
        update("tasks", (ts) =>
          ts.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks ?? []).map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s,
                  ),
                }
              : t,
          ),
        ),
      deleteTask: (id) => update("tasks", (ts) => ts.filter((t) => t.id !== id)),
      toggleLeadSaved: (id) =>
        update("leads", (ls) => ls.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l))),
      addLead: (l) => {
        const newLead: Lead = {
          id: l.id ?? `l${Date.now()}`,
          name: l.name,
          title: l.title,
          company: l.company,
          industry: l.industry || "—",
          location: l.location || "—",
          status: l.status ?? "queued",
          score: l.score ?? null,
          email: l.email,
          phone: l.phone,
          signal: l.signal,
          stage: l.stage ?? "new",
          saved: l.saved ?? false,
        };
        update("leads", (ls) => [newLead, ...ls]);
        return newLead;
      },
      updateLead: (id, patch) =>
        update("leads", (ls) => ls.map((l) => (l.id === id ? { ...l, ...patch, id: l.id } : l))),
      deleteLead: (id) => update("leads", (ls) => ls.filter((l) => l.id !== id)),
      toggleCompanySaved: (id) =>
        update("companies", (cs) => cs.map((c) => (c.id === id ? { ...c, saved: !c.saved } : c))),
      addCompany: (c) => {
        const newCompany: Company = {
          id: c.id ?? `c${Date.now()}`,
          name: c.name,
          domain: c.domain,
          industry: c.industry || "—",
          location: c.location || "—",
          size: c.size || "—",
          revenue: c.revenue || "—",
          employees: c.employees ?? 0,
          intent: c.intent ?? "warm",
          saved: c.saved ?? false,
        };
        update("companies", (cs) => [newCompany, ...cs]);
        return newCompany;
      },
      updateCompany: (id, patch) =>
        update("companies", (cs) =>
          cs.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)),
        ),
      deleteCompany: (id) => update("companies", (cs) => cs.filter((c) => c.id !== id)),

      addSequence: (input) => {
        const newSequence: Sequence = {
          id: `seq${Date.now()}`,
          name: input.name,
          steps: input.stepsDetail.length,
          leads: 0,
          opens: "0%",
          replies: "0%",
          status: input.status ?? "draft",
          description: input.description ?? "",
          objective: input.objective ?? "",
          audience: input.audience ?? "",
          tags: input.tags ?? [],
          stepsDetail: input.stepsDetail,
          settings: input.settings ?? DEFAULT_SEQUENCE_SETTINGS,
          createdAt: new Date().toISOString(),
        };
        update("sequences", (xs) => [newSequence, ...xs]);
        return newSequence;
      },
      updateSequence: (id, patch) =>
        update("sequences", (xs) =>
          xs.map((x) => {
            if (x.id !== id) return x;
            const next = { ...x, ...patch, id: x.id };
            if (patch.stepsDetail) next.steps = patch.stepsDetail.length;
            return next;
          }),
        ),
      deleteSequence: (id) => update("sequences", (xs) => xs.filter((x) => x.id !== id)),
      duplicateSequence: (id) =>
        update("sequences", (xs) => {
          const src = xs.find((x) => x.id === id);
          if (!src) return xs;
          return [
            {
              ...src,
              id: `seq${Date.now()}`,
              name: `${src.name} (copie)`,
              status: "draft" as const,
              leads: 0,
              opens: "0%",
              replies: "0%",
              createdAt: new Date().toISOString(),
            },
            ...xs,
          ];
        }),
      toggleSequenceStatus: (id) =>
        update("sequences", (xs) =>
          xs.map((x) =>
            x.id === id ? { ...x, status: x.status === "active" ? "paused" : "active" } : x,
          ),
        ),

      toggleWorkflowStatus: (id) =>
        update("workflows", (xs) =>
          xs.map((x) =>
            x.id === id ? { ...x, status: x.status === "active" ? "draft" : "active" } : x,
          ),
        ),
      advanceDealStage: (id) => {
        const order: Deal["stage"][] = ["qualified", "proposal", "negotiation", "won"];
        update("deals", (ds) =>
          ds.map((d) => {
            if (d.id !== id) return d;
            const i = order.indexOf(d.stage);
            if (i < 0 || i >= order.length - 1) return d;
            const next = order[i + 1];
            return {
              ...d,
              stage: next,
              probability: next === "won" ? 100 : Math.min(100, d.probability + 20),
            };
          }),
        );
      },
      addDeal: (d) => update("deals", (ds) => [{ id: `d${Date.now()}`, ...d }, ...ds]),
      markEmailRead: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, unread: false } : e))),
      markAllEmailsRead: () => update("emails", (es) => es.map((e) => ({ ...e, unread: false }))),
      addActivity,
      markNotificationsRead: () =>
        update("notifications", (ns) => ns.map((n) => ({ ...n, read: true }))),
      addList: (name, type) =>
        update("lists", (xs) => [
          { id: `list${Date.now()}`, name, type, count: 0, updated: "à l'instant" },
          ...xs,
        ]),
      deleteList: (id) => update("lists", (xs) => xs.filter((x) => x.id !== id)),
      toggleFormStatus: (id) =>
        update("forms", (xs) =>
          xs.map((x) =>
            x.id === id ? { ...x, status: x.status === "live" ? "draft" : "live" } : x,
          ),
        ),
      addWorkflow: (w) => update("workflows", (ws) => [w, ...ws]),
      duplicateWorkflow: (id) =>
        update("workflows", (ws) => {
          const src = ws.find((w) => w.id === id);
          if (!src) return ws;
          return [{ ...src, id: `wf${Date.now()}`, name: `${src.name} (copie)` }, ...ws];
        }),
      deleteWorkflow: (id) => update("workflows", (ws) => ws.filter((w) => w.id !== id)),
      reset: () => {
        setState(initialState);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* Intentionally ignored. */
        }
      },
      syncData,
      setSyncStatus,
      setLeads: (leads) => setState((s) => ({ ...s, leads })),
      setCompanies: (companies) => setState((s) => ({ ...s, companies })),
    }),
    [update, addActivity, syncData, setSyncStatus, setUser],
  );

  const value = useMemo(() => ({ ...state, ...actions, hydrated }), [state, actions, hydrated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return ctx;
}
