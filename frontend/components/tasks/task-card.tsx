//frontend\components\tasks\task-card.tsx
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  Clock,
  Linkedin,
  Mail,
  Phone,
  Pencil,
  Repeat,
  Tag,
  Trash2,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Task } from "@/lib/mock-data";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  dueLabel,
  dueState,
  subtaskProgress,
} from "@/lib/task-utils";

const iconMap = { call: Phone, email: Mail, linkedin: Linkedin, "follow-up": Clock } as const;

const dueTone: Record<string, string> = {
  overdue: "bg-red-50 text-red-700 border-red-200",
  today: "bg-primary/10 text-primary border-primary/20",
  tomorrow: "bg-amber-50 text-amber-700 border-amber-200",
  week: "bg-secondary text-muted-foreground border-border",
  later: "bg-secondary text-muted-foreground border-border",
  none: "bg-secondary text-muted-foreground border-border",
};

const priorityBar: Record<Task["priority"], string> = {
  high: "bg-red-500",
  med: "bg-amber-500",
  low: "bg-emerald-500",
};

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onToggleSubtask,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleSubtask: (subtaskId: string) => void;
}) {
  const Icon = iconMap[task.type];
  const state = dueState(task);
  const progress = subtaskProgress(task);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-foreground/20 hover:shadow-sm",
        task.done && "opacity-70",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", priorityBar[task.priority])} />

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 md:gap-3 p-3 md:p-4 pl-4 md:pl-5">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0"
          aria-label={task.done ? "Marquer à faire" : "Marquer terminée"}
        >
          {task.done ? (
            <CheckCircle2 className="size-5 text-primary" />
          ) : (
            <Circle className="size-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        <div className="min-w-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <Link
              to="/app/tasks/$id"
              params={{ id: task.id }}
              className={cn(
                "min-w-0 text-sm md:text-base font-medium leading-snug hover:underline break-words",
                task.done && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </Link>
            <div className="flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-md hover:bg-surface transition-colors"
                aria-label="Modifier"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-md hover:bg-surface transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="mt-1 text-[11px] md:text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] md:text-[11px] font-medium",
                dueTone[state],
              )}
            >
              <Clock className="size-3" />
              {dueLabel(task)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground">
              <Icon className="size-3" />
              {TYPE_LABELS[task.type]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground">
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.status && !task.done && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground">
                {STATUS_LABELS[task.status]}
              </span>
            )}
            {task.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground">
                {task.category}
              </span>
            )}
            {task.recurrence && task.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground">
                <Repeat className="size-3" /> Récurrente
              </span>
            )}
            {task.contact && task.contact !== "—" && (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground">
                <User className="size-3 shrink-0" />
                <span className="truncate max-w-28 md:max-w-none">{task.contact}</span>
              </span>
            )}
            {(task.tags ?? []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] md:text-[11px] text-muted-foreground"
              >
                <Tag className="size-3" /> {t}
              </span>
            ))}
          </div>

          {progress.total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] md:text-[11px] text-muted-foreground mb-1">
                <span>
                  Sous-tâches {progress.done}/{progress.total}
                </span>
                <span>{progress.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="mt-2 space-y-1">
                {(task.subtasks ?? []).slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onToggleSubtask(s.id)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        "size-3.5 shrink-0 rounded border grid place-items-center",
                        s.done ? "bg-primary border-primary" : "border-border",
                      )}
                    >
                      {s.done && <CheckCircle2 className="size-2.5 text-primary-foreground" />}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 truncate text-[11px] md:text-xs",
                        s.done ? "line-through text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {s.title}
                    </span>
                  </button>
                ))}
                {(task.subtasks ?? []).length > 3 && (
                  <Link
                    to="/app/tasks/$id"
                    params={{ id: task.id }}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    + {(task.subtasks ?? []).length - 3} autres
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
