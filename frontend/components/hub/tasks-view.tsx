// frontend/components/hub/tasks-view.tsx

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Phone,
  Linkedin,
  Plus,
  Trash2,
} from "@/components/icons";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Badge } from "@/components/common/ui-primitives";
import {
  PRIORITY_LABELS,
  dueLabel,
  dueState,
  groupTasks,
  type SortKey,
} from "@/lib/tasks/utils";
import type { Task } from "@/lib/data/mock-data";
import { cn } from "@/lib/core/utils";

const iconMap = { call: Phone, email: Mail, linkedin: Linkedin, "follow-up": Clock } as const;

export function TasksView() {
  const { tasks, toggleTask, deleteTask, addTask, addActivity } = useAppStore();
  const [filter, setFilter] = useState<"all" | "open" | "overdue" | "done">("open");
  const [sort, setSort] = useState<SortKey>("due");

  const openCount = tasks.filter((t) => !t.done).length;
  const overdueCount = tasks.filter((t) => !t.done && dueState(t) === "overdue").length;
  const todayCount = tasks.filter((t) => !t.done && dueState(t) === "today").length;
  const doneCount = tasks.filter((t) => t.done).length;

  const visible = useMemo(() => {
    const filtered = tasks.filter((t) => {
      if (filter === "open" && t.done) return false;
      if (filter === "done" && !t.done) return false;
      if (filter === "overdue" && (t.done || dueState(t) !== "overdue")) return false;
      return true;
    });
    if (sort === "priority") {
      const order: Record<Task["priority"], number> = { high: 0, med: 1, low: 2 };
      return [...filtered].sort((a, b) => order[a.priority] - order[b.priority]);
    }
    if (sort === "alpha") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [tasks, filter, sort]);

  const groups = useMemo(() => groupTasks(visible), [visible]);

  const create = (values: any) => {
    addTask(values);
    addActivity("Tâche créée", values.title);
    toast.success("Tâche ajoutée");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <Stat label="En cours" value={openCount} tone="default" active={filter === "open"} onClick={() => setFilter("open")} />
        <Stat label="Aujourd'hui" value={todayCount} tone="primary" />
        <Stat label="En retard" value={overdueCount} tone="danger" active={filter === "overdue"} onClick={() => setFilter("overdue")} />
        <Stat label="Terminées" value={doneCount} tone="success" active={filter === "done"} onClick={() => setFilter("done")} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface/40 p-0.5">
          {(
            [
              { key: "all", label: "Toutes" },
              { key: "open", label: "À faire" },
              { key: "overdue", label: "En retard" },
              { key: "done", label: "Faites" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="due">Trier : Échéance</option>
          <option value="priority">Trier : Priorité</option>
          <option value="alpha">Trier : Alphabétique</option>
        </select>

        <TaskFormDialog
          trigger={
            <button className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[11px] font-medium text-background transition-opacity hover:opacity-90">
              <Plus className="size-3.5" /> Nouvelle tâche
            </button>
          }
          onSubmit={create}
        />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/20 p-8 text-center">
          <AlertTriangle className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune tâche ne correspond à ce filtre.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {group.label}
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {group.items.length}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <ul className="space-y-1.5">
                {group.items.map((task) => {
                  const Icon = iconMap[task.type];
                  const overdue = !task.done && dueState(task) === "overdue";
                  return (
                    <li
                      key={task.id}
                      className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          toggleTask(task.id);
                          toast.success(task.done ? "Tâche décochée" : "Tâche terminée 🎉");
                        }}
                        aria-label={task.done ? "Marquer à faire" : "Marquer terminée"}
                        className="shrink-0"
                      >
                        {task.done ? (
                          <CheckCircle2 className="size-4 text-primary" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground transition-colors hover:text-primary" />
                        )}
                      </button>

                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-xs md:text-sm",
                            task.done && "text-muted-foreground line-through",
                          )}
                        >
                          {task.title}
                        </p>
                        <p className="truncate text-[10.5px] text-muted-foreground">
                          {task.contact} · {dueLabel(task)}
                        </p>
                      </div>

                      <Badge
                        tone={
                          overdue
                            ? "destructive"
                            : task.priority === "high"
                              ? "primary"
                              : task.priority === "med"
                                ? "warning"
                                : "muted"
                        }
                        className="hidden sm:inline-flex shrink-0"
                      >
                        {overdue ? "En retard" : PRIORITY_LABELS[task.priority]}
                      </Badge>

                      <Link
                        to="/app/tasks/$id"
                        params={{ id: task.id }}
                        className="hidden shrink-0 text-[11px] text-primary hover:underline md:inline"
                      >
                        Ouvrir →
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          deleteTask(task.id);
                          toast("Tâche supprimée");
                        }}
                        aria-label="Supprimer"
                        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: "default" | "primary" | "danger" | "success";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneColor =
    tone === "primary"
      ? "text-primary"
      : tone === "danger"
        ? "text-destructive"
        : tone === "success"
          ? "text-success"
          : "text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "rounded-xl border bg-background px-3 py-2 text-left transition-all md:px-4 md:py-3",
        active ? "border-primary/50 shadow-sm" : "border-border hover:border-border",
        onClick && "cursor-pointer hover:bg-surface/40",
        !onClick && "cursor-default",
      )}
    >
      <p className={cn("font-display text-xl italic leading-none tabular-nums md:text-2xl", toneColor)}>
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </button>
  );
}
