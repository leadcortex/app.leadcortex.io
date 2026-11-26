// frontend/components/tasks/task-card.tsx

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
  Trash2,
} from "@/components/icons";

import { cn } from "@/lib/core/utils";
import type { Task } from "@/lib/data/mock-data";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  dueLabel,
  dueState,
  subtaskProgress,
} from "@/lib/tasks/utils";

const iconMap = { call: Phone, email: Mail, linkedin: Linkedin, "follow-up": Clock } as const;

const dueTone: Record<string, string> = {
  overdue: "text-destructive",
  today: "text-primary",
  tomorrow: "text-foreground",
  week: "text-muted-foreground",
  later: "text-muted-foreground",
  none: "text-muted-foreground",
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
  const hasContact = Boolean(task.contact && task.contact !== "—");
  const tags = task.tags ?? [];

  return (
    <div className="group grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-3 py-3 transition-colors duration-150 ease-out hover:bg-foreground/[0.03] md:px-4">
      <button
        onClick={onToggle}
        className="-m-2 grid size-9 shrink-0 place-items-center md:size-8"
        aria-label={task.done ? "Marquer à faire" : "Marquer terminée"}
      >
        {task.done ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <Circle className="size-5 text-muted-foreground transition-colors hover:text-primary" />
        )}
      </button>

      <div className="min-w-0">
        <Link
          to="/app/tasks/$id"
          params={{ id: task.id }}
          className={cn(
            "block min-w-0 break-words text-sm font-medium leading-snug hover:underline",
            task.done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </Link>

        {task.description && (
          <p className="mt-1 line-clamp-2 max-w-prose text-[13px] text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className={cn("font-medium", !task.done && dueTone[state])}>{dueLabel(task)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Icon className="size-3.5" />
            {TYPE_LABELS[task.type]}
          </span>
          {hasContact && (
            <>
              <span aria-hidden>·</span>
              <span className="max-w-40 truncate md:max-w-none">{task.contact}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>Priorité {PRIORITY_LABELS[task.priority].toLowerCase()}</span>
          {task.status && !task.done && task.status !== "todo" && (
            <>
              <span aria-hidden>·</span>
              <span>{STATUS_LABELS[task.status]}</span>
            </>
          )}
          {task.category && (
            <>
              <span aria-hidden>·</span>
              <span>{task.category}</span>
            </>
          )}
          {task.recurrence && task.recurrence !== "none" && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Repeat className="size-3.5" /> Récurrente
              </span>
            </>
          )}
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">
              {t}
            </span>
          ))}
        </div>

        {progress.total > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs tabular-nums text-muted-foreground">
              Sous-tâches {progress.done}/{progress.total}
            </p>
            {(task.subtasks ?? []).slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => onToggleSubtask(s.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "grid size-3.5 shrink-0 place-items-center rounded border",
                    s.done ? "border-primary bg-primary" : "border-border",
                  )}
                >
                  {s.done && <CheckCircle2 className="size-3 text-primary-foreground" />}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate text-[13px]",
                    s.done ? "text-muted-foreground line-through" : "text-foreground",
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
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {(task.subtasks ?? []).length - 3} de plus
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-start gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="grid size-9 place-items-center rounded-lg transition-colors hover:bg-surface md:size-8"
          aria-label="Modifier"
        >
          <Pencil className="size-4 text-muted-foreground" />
        </button>
        <button
          onClick={onDelete}
          className="grid size-9 place-items-center rounded-lg transition-colors hover:bg-surface md:size-8"
          aria-label="Supprimer"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
