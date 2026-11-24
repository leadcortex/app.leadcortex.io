// frontend/lib/state/store.tsx

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
} from "../data/mock-data";
import { guessDomainFromName } from "../companies/database";

import type { EmailLabel } from "@shared/types/email-types";

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

export type UndoEntry = {
  id: string;
  label: string;
  revert: () => void;
  expiresAt: number;
};

type State = {
  version: number;
  user: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    plan: string | null;
  };
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
  labels: EmailLabel[];
  snoozedEmails: Record<string, string>;
  activity: { id: string; label: string; detail: string; status: string; time: string }[];
  notifications: NotificationItem[];
  syncStatus: "idle" | "syncing" | "synced" | "error";
};

export type NotificationItem = {
  id: string;
  label: string;
  time: string;
  read: boolean;
  important?: boolean;
  saved?: boolean;
  kind?: "info" | "success" | "warning" | "tokens" | "message" | "email";
  detail?: string;
  href?: string;
  meta?: Record<string, unknown>;
};

const MAX_SECONDARY_NOTIFICATIONS = 50;

function trimSecondaryNotifications(notifications: NotificationItem[]): NotificationItem[] {
  const secondary = notifications.filter((notification) => !notification.important);
  const retainedIds = new Set(
    secondary
      .filter((notification) => notification.saved)
      .slice(0, MAX_SECONDARY_NOTIFICATIONS)
      .map((notification) => notification.id),
  );
  let remainingSlots = MAX_SECONDARY_NOTIFICATIONS - retainedIds.size;

  for (const notification of secondary) {
    if (!notification.saved && remainingSlots > 0) {
      retainedIds.add(notification.id);
      remainingSlots -= 1;
    }
  }

  return notifications.filter(
    (notification) => notification.important || retainedIds.has(notification.id),
  );
}

function normalizeNotifications(value: unknown): NotificationItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const notifications = value.filter(
    (notification): notification is NotificationItem =>
      !!notification &&
      typeof notification === "object" &&
      typeof notification.id === "string" &&
      typeof notification.label === "string" &&
      typeof notification.time === "string" &&
      typeof notification.read === "boolean",
  );
  return trimSecondaryNotifications(
    notifications.map((notification) =>
      notification.id === "n1" && notification.label.startsWith("Bienvenue sur LeadCortex")
        ? { ...notification, label: "Bienvenue sur LeadCortex" }
        : notification,
    ),
  );
}

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "demo-ai-limit",
    label: "Exemple — limite IA presque atteinte",
    detail: "Votre espace approche de sa limite mensuelle.",
    time: "Il y a 2 min",
    read: false,
    important: true,
    kind: "tokens",
    meta: { used: 9200, limit: 10000 },
    href: "/app/settings/billing",
  },
  {
    id: "demo-new-message",
    label: "Exemple — nouveau message de Camille Martin",
    detail: "Pouvez-vous me partager la présentation de votre solution ?",
    time: "Il y a 8 min",
    read: false,
    important: true,
    kind: "message",
    href: "/app/conversations",
  },
  {
    id: "demo-new-email",
    label: "Exemple — réponse reçue par email",
    detail: "Camille Martin a répondu à votre dernier message.",
    time: "Il y a 10 min",
    read: false,
    important: true,
    kind: "email",
    href: "/app/emails",
  },
  {
    id: "demo-sync-warning",
    label: "Exemple — synchronisation à vérifier",
    detail: "Un connecteur demande votre attention.",
    time: "Il y a 11 min",
    read: true,
    important: true,
    kind: "warning",
    href: "/app/settings",
  },
  {
    id: "demo-new-prospect",
    label: "Exemple — prospect créé",
    detail: "Sophie Bernard a été ajoutée à votre base.",
    time: "Il y a 12 min",
    read: true,
    kind: "success",
    href: "/app/people",
  },
  {
    id: "demo-export",
    label: "Exemple — export CSV terminé",
    detail: "12 prospects exportés avec succès.",
    time: "Il y a 18 min",
    read: true,
    kind: "success",
    href: "/app/people",
  },
];

type Actions = {
  setUser: (user: State["user"]) => void;
  clearUser: () => void;

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
  toggleEmailRead: (id: string) => void;

  toggleEmailStar: (id: string) => void;
  archiveEmail: (id: string) => void;
  unarchiveEmail: (id: string) => void;
  deleteEmail: (id: string) => void;
  restoreEmail: (id: string) => void;
  moveEmailToFolder: (id: string, folder: string) => void;
  snoozeEmail: (id: string, until: string) => void;
  unsnoozeEmail: (id: string) => void;

  toggleEmailLabel: (emailId: string, labelId: string) => void;
  addEmailLabel: (label: EmailLabel) => void;
  deleteEmailLabel: (id: string) => void;

  saveDraft: (draft: Email) => void;
  deleteDraft: (id: string) => void;
  scheduleEmail: (email: Email, at: string) => void;
  sendEmail: (email: Email) => void;

  addActivity: (label: string, detail: string) => void;
  markNotificationsRead: (ids?: string[]) => void;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  toggleNotificationSaved: (id: string) => void;
  deleteNotification: (id: string) => void;
  deleteNotifications: (ids: string[]) => void;
  restoreNotifications: (items: NotificationItem[], order: string[]) => void;
  deleteReadNotifications: () => void;
  addNotification: (n: Omit<NotificationItem, "id" | "time" | "read"> & { id?: string }) => void;
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

  pushUndo: (entry: UndoEntry) => void;
  undoLastAction: () => void;
  clearUndo: () => void;
};

type Runtime = { hydrated: boolean };

const STORAGE_KEY = "leadcortex-state-v1";
const CURRENT_VERSION = 3;
const NOTIFICATION_DEMOS_KEY = "leadcortex-notification-demos-v2";

const initialState: State = {
  version: CURRENT_VERSION,
  user: { name: null, email: null, avatarUrl: null, plan: null },
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
  labels: [
    { id: "label-important", name: "Important", color: "var(--destructive)" },
    { id: "label-client", name: "Client", color: "var(--primary)" },
    { id: "label-interne", name: "Interne", color: "var(--chart-4)" },
    { id: "label-a-faire", name: "À faire", color: "var(--warning)" },
  ],
  snoozedEmails: {},
  activity: [],
  notifications: import.meta.env.DEV
    ? DEMO_NOTIFICATIONS
    : [{ id: "n1", label: "Bienvenue sur LeadCortex", time: "à l'instant", read: false }],
  syncStatus: "idle",
};

const Ctx = createContext<(State & Actions & Runtime) | null>(null);

const UNDO_TTL_MS = 8000;

function findCompanyByName(companies: Company[], name: string): Company | undefined {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;
  return companies.find((c) => c.name.trim().toLowerCase() === normalized);
}

function uniqueId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildCompanyFromLead(lead: Lead): Company {
  const domain = guessDomainFromName(lead.company) ?? "";
  return {
    id: uniqueId("c"),
    name: lead.company.trim(),
    domain,
    industry: lead.industry || "—",
    location: lead.location || "—",
    size: "—",
    revenue: "—",
    employees: 0,
    intent: "warm",
    saved: false,
    ...(lead.companyLogoUrl ? { companyLogoUrl: lead.companyLogoUrl } : {}),
  };
}

function enrichCompanyFromLead(company: Company, lead: Lead): Company {
  const next = { ...company };
  if ((!next.industry || next.industry === "—") && lead.industry) {
    next.industry = lead.industry;
  }
  if ((!next.location || next.location === "—") && lead.location) {
    next.location = lead.location;
  }
  if (!next.companyLogoUrl && lead.companyLogoUrl) {
    next.companyLogoUrl = lead.companyLogoUrl;
  }
  return next;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);

  useEffect(() => {
    try {
      const addNotificationDemos =
        import.meta.env.DEV && localStorage.getItem(NOTIFICATION_DEMOS_KEY) !== "true";
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === CURRENT_VERSION) {
          const persistedNotifications = normalizeNotifications(parsed.notifications);
          setState((s) => ({
            ...s,
            ...parsed,
            ...(persistedNotifications
              ? {
                  notifications: trimSecondaryNotifications(
                    addNotificationDemos
                      ? [
                          ...DEMO_NOTIFICATIONS,
                          ...persistedNotifications.filter(
                            (notification) =>
                              !DEMO_NOTIFICATIONS.some((demo) => demo.id === notification.id),
                          ),
                        ]
                      : persistedNotifications,
                  ),
                }
              : {}),
            user: initialState.user,
          }));
        } else if (parsed?.version === 2) {
          const persistedNotifications = normalizeNotifications(parsed.notifications);
          setState((s) => ({
            ...s,
            ...parsed,
            version: CURRENT_VERSION,
            labels: s.labels,
            snoozedEmails: parsed.snoozedEmails ?? {},
            ...(persistedNotifications ? { notifications: persistedNotifications } : {}),
            user: initialState.user,
          }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setState(initialState);
        }
      }
      if (addNotificationDemos) localStorage.setItem(NOTIFICATION_DEMOS_KEY, "true");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const { user: _user, ...persistedState } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch {
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!undoEntry) return;
    const delay = Math.max(0, undoEntry.expiresAt - Date.now());
    const timer = window.setTimeout(() => setUndoEntry(null), delay);
    return () => window.clearTimeout(timer);
  }, [undoEntry]);

  const update = useCallback(
    <K extends keyof State>(k: K, v: State[K] | ((prev: State[K]) => State[K])) => {
      setState((s) => ({
        ...s,
        [k]: typeof v === "function" ? (v as (p: State[K]) => State[K])(s[k]) : v,
      }));
    },
    [],
  );

  const setUser = useCallback((user: State["user"]) => {
    setState((s) => ({ ...s, user }));
  }, []);

  const clearUser = useCallback(() => {
    setState((s) => ({ ...s, user: initialState.user }));
  }, []);

  const addActivity = useCallback((label: string, detail: string) => {
    setState((s) => ({
      ...s,
      activity: [
        { id: `a${Date.now()}`, label, detail, status: "active" as const, time: "à l'instant" },
        ...s.activity,
      ].slice(0, 12),
    }));
  }, []);

  const syncData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, syncStatus: "syncing" }));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setState((s) => ({ ...s, syncStatus: "synced" }));
      setTimeout(() => setState((s) => ({ ...s, syncStatus: "idle" })), 3000);
    } catch {
      setState((s) => ({ ...s, syncStatus: "error" }));
      setTimeout(() => setState((s) => ({ ...s, syncStatus: "idle" })), 5000);
    }
  }, []);

  const setSyncStatus = useCallback((status: State["syncStatus"]) => {
    setState((s) => ({ ...s, syncStatus: status }));
  }, []);

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

  const pushUndo = useCallback((entry: UndoEntry) => setUndoEntry(entry), []);
  const undoLastAction = useCallback(() => {
    setUndoEntry((current) => {
      current?.revert();
      return null;
    });
  }, []);
  const clearUndo = useCallback(() => setUndoEntry(null), []);

  const actions: Actions = useMemo(
    () => ({
      setUser,
      clearUser,

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
          id: l.id ?? uniqueId("l"),
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
          avatarUrl: l.avatarUrl,
          companyLogoUrl: l.companyLogoUrl,
          tags: l.tags ?? [],
          notes: l.notes ?? "",
        };

        setState((s) => {
          let nextCompanies = s.companies;

          if (
            newLead.company &&
            newLead.company.trim() &&
            newLead.company.trim() !== "—" &&
            !findCompanyByName(s.companies, newLead.company)
          ) {
            const autoCompany = buildCompanyFromLead(newLead);
            nextCompanies = [autoCompany, ...s.companies];
          }

          return {
            ...s,
            leads: [newLead, ...s.leads],
            companies: nextCompanies,
          };
        });

        return newLead;
      },

      updateLead: (id, patch) => {
        setState((s) => {
          const nextLeads = s.leads.map((l) => (l.id === id ? { ...l, ...patch, id: l.id } : l));

          let nextCompanies = s.companies;

          if (patch.company && patch.company.trim() && patch.company.trim() !== "—") {
            const exists = findCompanyByName(s.companies, patch.company);
            if (!exists) {
              const lead = nextLeads.find((l) => l.id === id);
              if (lead) {
                const autoCompany = buildCompanyFromLead(lead);
                nextCompanies = [autoCompany, ...s.companies];
              }
            }
          }

          return { ...s, leads: nextLeads, companies: nextCompanies };
        });
      },

      deleteLead: (id) => update("leads", (ls) => ls.filter((l) => l.id !== id)),

      toggleCompanySaved: (id) =>
        update("companies", (cs) => cs.map((c) => (c.id === id ? { ...c, saved: !c.saved } : c))),

      addCompany: (c) => {
        let newCompany: Company = {
          id: c.id ?? uniqueId("c"),
          name: c.name,
          domain: c.domain,
          industry: c.industry || "—",
          location: c.location || "—",
          size: c.size || "—",
          revenue: c.revenue || "—",
          employees: c.employees ?? 0,
          intent: c.intent ?? "warm",
          saved: c.saved ?? false,
          companyLogoUrl: c.companyLogoUrl,
          linkedin: c.linkedin,
          website: c.website,
          description: c.description,
          notes: c.notes,
          tags: c.tags ?? [],
        };

        setState((s) => {
          const matchingLeads = s.leads.filter(
            (l) => l.company.trim().toLowerCase() === c.name.trim().toLowerCase(),
          );
          if (matchingLeads.length > 0) {
            newCompany = matchingLeads.reduce(
              (acc, lead) => enrichCompanyFromLead(acc, lead),
              newCompany,
            );
          }

          return { ...s, companies: [newCompany, ...s.companies] };
        });

        return newCompany;
      },

      updateCompany: (id, patch) => {
        setState((s) => {
          const current = s.companies.find((c) => c.id === id);
          if (!current) return s;

          const nextCompanies = s.companies.map((c) =>
            c.id === id ? { ...c, ...patch, id: c.id } : c,
          );

          let nextLeads = s.leads;
          if (
            patch.name &&
            patch.name.trim() &&
            current.name.trim().toLowerCase() !== patch.name.trim().toLowerCase()
          ) {
            const oldName = current.name.trim().toLowerCase();
            const newName = patch.name.trim();
            nextLeads = s.leads.map((l) =>
              l.company.trim().toLowerCase() === oldName ? { ...l, company: newName } : l,
            );
          }

          return { ...s, companies: nextCompanies, leads: nextLeads };
        });
      },

      deleteCompany: (id) => {
        update("companies", (cs) => cs.filter((c) => c.id !== id));
      },

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
      toggleEmailRead: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, unread: !e.unread } : e))),

      toggleEmailStar: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))),
      archiveEmail: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, folder: "archive" } : e))),
      unarchiveEmail: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, folder: "inbox" } : e))),
      deleteEmail: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, folder: "trash" } : e))),
      restoreEmail: (id) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, folder: "inbox" } : e))),
      moveEmailToFolder: (id, folder) =>
        update("emails", (es) => es.map((e) => (e.id === id ? { ...e, folder } : e))),
      snoozeEmail: (id, until) => {
        setState((s) => ({
          ...s,
          emails: s.emails.map((e) => (e.id === id ? { ...e, snoozedUntil: until } : e)),
          snoozedEmails: { ...s.snoozedEmails, [id]: until },
        }));
      },
      unsnoozeEmail: (id) => {
        setState((s) => {
          const next = { ...s.snoozedEmails };
          delete next[id];
          return {
            ...s,
            emails: s.emails.map((e) => (e.id === id ? { ...e, snoozedUntil: undefined } : e)),
            snoozedEmails: next,
          };
        });
      },

      toggleEmailLabel: (emailId, labelId) =>
        update("emails", (es) =>
          es.map((e) => {
            if (e.id !== emailId) return e;
            const current = new Set(e.labels ?? []);
            current.has(labelId) ? current.delete(labelId) : current.add(labelId);
            return { ...e, labels: Array.from(current) };
          }),
        ),
      addEmailLabel: (label) => update("labels", (xs) => [...xs, label]),
      deleteEmailLabel: (id) => {
        setState((s) => ({
          ...s,
          labels: s.labels.filter((l) => l.id !== id),
          emails: s.emails.map((e) => ({
            ...e,
            labels: (e.labels ?? []).filter((lid) => lid !== id),
          })),
        }));
      },

      saveDraft: (draft) => {
        update("emails", (es) => {
          const exists = es.some((e) => e.id === draft.id);
          if (exists) return es.map((e) => (e.id === draft.id ? draft : e));
          return [draft, ...es];
        });
      },
      deleteDraft: (id) => update("emails", (es) => es.filter((e) => e.id !== id)),
      scheduleEmail: (email, at) => {
        const next: Email = { ...email, status: "scheduled", scheduledAt: at, folder: "scheduled" };
        update("emails", (es) => {
          const exists = es.some((e) => e.id === next.id);
          if (exists) return es.map((e) => (e.id === next.id ? next : e));
          return [next, ...es];
        });
      },
      sendEmail: (email) => {
        const next: Email = {
          ...email,
          status: "sent",
          folder: "sent",
          unread: false,
          time: "à l'instant",
          date: new Date().toISOString(),
        };
        update("emails", (es) => {
          const exists = es.some((e) => e.id === next.id);
          if (exists) return es.map((e) => (e.id === next.id ? next : e));
          return [next, ...es];
        });
      },

      addActivity,
      markNotificationsRead: (ids) =>
        update("notifications", (ns) =>
          ns.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)),
        ),
      markNotificationRead: (id) =>
        update("notifications", (ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markNotificationUnread: (id) =>
        update("notifications", (ns) => ns.map((n) => (n.id === id ? { ...n, read: false } : n))),
      toggleNotificationSaved: (id) =>
        update("notifications", (ns) =>
          ns.map((n) => (n.id === id ? { ...n, saved: !n.saved } : n)),
        ),
      deleteNotification: (id) => update("notifications", (ns) => ns.filter((n) => n.id !== id)),
      deleteNotifications: (ids) =>
        update("notifications", (ns) => ns.filter((n) => !ids.includes(n.id))),
      restoreNotifications: (items, order) =>
        update("notifications", (ns) => {
          const present = new Set(ns.map((n) => n.id));
          const merged = [...ns, ...items.filter((n) => !present.has(n.id))];
          const rank = new Map(order.map((id, i) => [id, i]));
          return merged
            .map((n, i) => ({ n, i }))
            .sort((a, b) => (rank.get(a.n.id) ?? -1) - (rank.get(b.n.id) ?? -1) || a.i - b.i)
            .map(({ n }) => n);
        }),
      deleteReadNotifications: () =>
        update("notifications", (ns) => ns.filter((n) => !n.read || n.saved)),
      addNotification: (n) =>
        update("notifications", (ns) => {
          const id =
            n.id ?? `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          return trimSecondaryNotifications([
            { ...n, id, time: "à l'instant", read: false },
            ...ns.filter((notification) => notification.id !== id),
          ]);
        }),
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
        setUndoEntry(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
        }
      },
      syncData,
      setSyncStatus,
      setLeads: (leads) => setState((s) => ({ ...s, leads })),
      setCompanies: (companies) => setState((s) => ({ ...s, companies })),

      pushUndo,
      undoLastAction,
      clearUndo,
    }),
    [
      update,
      addActivity,
      syncData,
      setSyncStatus,
      setUser,
      clearUser,
      pushUndo,
      undoLastAction,
      clearUndo,
    ],
  );

  const value = useMemo(
    () => ({ ...state, ...actions, hydrated, lastUndo: undoEntry }),
    [state, actions, hydrated, undoEntry],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return ctx as State & Actions & Runtime & { lastUndo: UndoEntry | null };
}
