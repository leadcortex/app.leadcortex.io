//frontend\lib\task-utils.ts
import type { Task, TaskRecurrence, TaskReminder, TaskStatus } from "@/lib/mock-data";

export const TASK_CATEGORIES = [
  "Prospection",
  "Relance",
  "Négociation",
  "Onboarding",
  "Support",
  "Interne",
  "Administratif",
] as const;

export const TYPE_LABELS: Record<Task["type"], string> = {
  call: "Appel",
  email: "Email",
  linkedin: "LinkedIn",
  "follow-up": "Suivi",
};

export const PRIORITY_LABELS: Record<Task["priority"], string> = {
  high: "Haute",
  med: "Moyenne",
  low: "Basse",
};

export const PRIORITY_ORDER: Record<Task["priority"], number> = { high: 0, med: 1, low: 2 };

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  "in-progress": "En cours",
  blocked: "Bloquée",
  done: "Terminée",
};

export const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  none: "Ne se répète pas",
  daily: "Tous les jours",
  weekdays: "Du lundi au vendredi",
  weekly: "Toutes les semaines",
  monthly: "Tous les mois",
  yearly: "Tous les ans",
};

export const REMINDER_LABELS: Record<TaskReminder, string> = {
  none: "Aucun rappel",
  "5m": "5 minutes avant",
  "15m": "15 minutes avant",
  "1h": "1 heure avant",
  "1d": "1 jour avant",
};

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Nombre de jours entiers entre aujourd'hui et la date (négatif = passé). */
export function daysFromToday(iso?: string): number | undefined {
  const date = fromISODate(iso);
  if (!date) return undefined;
  return Math.round((date.getTime() - startOfToday().getTime()) / 86_400_000);
}

export function formatLongDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]?.slice(0, 4)} ${date.getFullYear()}`;
}

export type DueState = "none" | "overdue" | "today" | "tomorrow" | "week" | "later";

export function dueState(task: Task): DueState {
  const diff = daysFromToday(task.dueDate);
  if (diff === undefined) return "none";
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "week";
  return "later";
}

/** Libellé lisible de l'échéance : date précise si disponible, sinon l'ancien libellé texte. */
export function dueLabel(task: Task): string {
  const date = fromISODate(task.dueDate);
  if (!date) return task.due || "Sans échéance";
  const diff = daysFromToday(task.dueDate) ?? 0;
  let base: string;
  if (diff === 0) base = "Aujourd'hui";
  else if (diff === 1) base = "Demain";
  else if (diff === -1) base = "Hier";
  else if (diff > 1 && diff <= 6) base = DAY_NAMES[date.getDay()] ?? formatShortDate(date);
  else base = formatShortDate(date);
  return task.dueTime ? `${base} · ${task.dueTime}` : base;
}

/** Libellé court utilisé pour la colonne "due" historique du modèle. */
export function legacyDueLabel(iso?: string, time?: string): string {
  const date = fromISODate(iso);
  if (!date) return "Sans échéance";
  const diff = daysFromToday(iso) ?? 0;
  if (diff === 0) return time ? `Aujourd'hui · ${time}` : "Aujourd'hui";
  if (diff === 1) return time ? `Demain · ${time}` : "Demain";
  return formatShortDate(date);
}

export function subtaskProgress(task: Task): { done: number; total: number; pct: number } {
  const subtasks = task.subtasks ?? [];
  const done = subtasks.filter((s) => s.done).length;
  const total = subtasks.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export type SortKey = "due" | "priority" | "created" | "alpha";

export function sortTasks(tasks: Task[], key: SortKey): Task[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    if (key === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (key === "alpha") return a.title.localeCompare(b.title, "fr");
    if (key === "created") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    const av = a.dueDate ? `${a.dueDate}T${a.dueTime ?? "23:59"}` : "9999";
    const bv = b.dueDate ? `${b.dueDate}T${b.dueTime ?? "23:59"}` : "9999";
    return av.localeCompare(bv);
  });
  return copy;
}

export const GROUP_ORDER: { key: DueState | "done"; label: string }[] = [
  { key: "overdue", label: "En retard" },
  { key: "today", label: "Aujourd'hui" },
  { key: "tomorrow", label: "Demain" },
  { key: "week", label: "Cette semaine" },
  { key: "later", label: "Plus tard" },
  { key: "none", label: "Sans échéance" },
  { key: "done", label: "Terminées" },
];

export function groupTasks(tasks: Task[]): { key: string; label: string; items: Task[] }[] {
  return GROUP_ORDER.map((group) => ({
    key: group.key,
    label: group.label,
    items: tasks.filter((t) =>
      group.key === "done" ? t.done : !t.done && dueState(t) === group.key,
    ),
  })).filter((group) => group.items.length > 0);
}

export function timeOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let h = 6; h <= 21; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      const v = `${`${h}`.padStart(2, "0")}:${`${m}`.padStart(2, "0")}`;
      out.push({ value: v, label: v });
    }
  }
  return out;
}
