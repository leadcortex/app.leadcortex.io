//frontend\routes\app.tasks.$id.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Mail,
  Linkedin,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  MessageSquare,
  Repeat,
  Bell,
  Tag,
  Timer,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { TaskDetailSkeleton } from "@/components/skeletons";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import {
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  REMINDER_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  dueLabel,
  dueState,
  subtaskProgress,
} from "@/lib/task-utils";

export const Route = createFileRoute("/app/tasks/$id")({
  head: () => ({
    meta: [{ title: "Tâche — LeadCortex" }],
  }),
  pendingComponent: () => <TaskDetailSkeleton />,
  component: TasksDetailPage,
});
const iconMap = {
  call: Phone,
  email: Mail,
  linkedin: Linkedin,
  "follow-up": Clock,
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right min-w-0">{children}</span>
    </div>
  );
}

function TasksDetailPage() {
  const { id } = Route.useParams();
  const { tasks, toggleTask, deleteTask, updateTask, toggleSubtask, addActivity } = useAppStore();
  const task = tasks.find((t) => t.id === id);
  const [editOpen, setEditOpen] = useState(false);

  if (!task) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl italic">Tâche introuvable</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Cette tâche n'existe pas ou a été supprimée.
        </p>
        <Link
          to="/app/tasks"
          className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Retour aux tâches
        </Link>
      </div>
    );
  }

  const Icon = iconMap[task.type];
  const progress = subtaskProgress(task);
  const overdue = !task.done && dueState(task) === "overdue";

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link
        to="/app/tasks"
        className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-6"
      >
        <ArrowLeft className="size-4" /> Retour aux tâches
      </Link>

      {}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-start gap-3 md:gap-4 min-w-0">
          <button
            onClick={() => {
              toggleTask(task.id);
              toast.success(task.done ? "Tâche décochée" : "Tâche terminée 🎉");
              addActivity("Tâche " + (task.done ? "décochée" : "terminée"), task.title);
            }}
            className="mt-1 shrink-0"
            aria-label={task.done ? "Marquer à faire" : "Marquer terminée"}
          >
            {task.done ? (
              <CheckCircle2 className="size-7 md:size-8 text-primary" />
            ) : (
              <Circle className="size-7 md:size-8 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>
          <div className="min-w-0">
            <h1
              className={cn(
                "font-display text-2xl md:text-4xl italic break-words",
                task.done && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </h1>
            {task.description && (
              <p className="mt-2 text-xs md:text-sm text-muted-foreground whitespace-pre-line">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <User className="size-4" /> {task.contact}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon className="size-4" /> {TYPE_LABELS[task.type]}
              </span>
              <span className={cn("flex items-center gap-1.5", overdue && "text-red-600")}>
                <Calendar className="size-4" /> {dueLabel(task)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              deleteTask(task.id);
              toast.success("Tâche supprimée");
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="size-4" /> Supprimer
          </button>
          <TaskFormDialog
            mode="edit"
            task={task}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSubmit={(values) => {
              updateTask(task.id, values);
              toast.success("Tâche mise à jour");
            }}
            trigger={
              <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors">
                <Edit className="size-4" /> Modifier
              </button>
            }
          />
        </div>
      </div>

      {}
      <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-8">
        <Badge
          tone={
            task.priority === "high" ? "primary" : task.priority === "med" ? "warning" : "muted"
          }
        >
          Priorité {PRIORITY_LABELS[task.priority]}
        </Badge>
        <Badge tone={task.done ? "success" : overdue ? "destructive" : "muted"}>
          {task.done ? "Terminée" : STATUS_LABELS[task.status ?? "todo"]}
        </Badge>
        <Badge tone={overdue ? "destructive" : "muted"}>{dueLabel(task)}</Badge>
        {task.category && <Badge tone="muted">{task.category}</Badge>}
        {(task.tags ?? []).map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <Tag className="size-3" /> {t}
          </span>
        ))}
      </div>

      {}
      {progress.total > 0 && (
        <div className="rounded-xl border border-border bg-background p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Sous-tâches
            </h3>
            <span className="text-xs text-muted-foreground">
              {progress.done}/{progress.total} · {progress.pct}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {(task.subtasks ?? []).map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSubtask(task.id, s.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-left hover:bg-surface transition-colors"
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded border grid place-items-center",
                    s.done ? "bg-primary border-primary" : "border-border",
                  )}
                >
                  {s.done && <CheckCircle2 className="size-3 text-primary-foreground" />}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-xs md:text-sm",
                    s.done && "line-through text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="rounded-xl border border-border bg-background p-4 md:p-6">
          <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Détails de la tâche
          </h3>
          <div className="space-y-3 text-xs md:text-sm">
            <Row label="Type">
              <span className="inline-flex items-center gap-1.5">
                <Icon className="size-4" /> {TYPE_LABELS[task.type]}
              </span>
            </Row>
            <Row label="Contact">{task.contact}</Row>
            <Row label="Échéance">
              <Badge
                tone={overdue ? "destructive" : dueState(task) === "today" ? "primary" : "muted"}
              >
                {dueLabel(task)}
              </Badge>
            </Row>
            <Row label="Priorité">
              <Badge
                tone={
                  task.priority === "high"
                    ? "primary"
                    : task.priority === "med"
                      ? "warning"
                      : "muted"
                }
              >
                {PRIORITY_LABELS[task.priority]}
              </Badge>
            </Row>
            <Row label="Statut">
              <Badge tone={task.done ? "success" : "muted"}>
                {task.done ? "Terminée" : STATUS_LABELS[task.status ?? "todo"]}
              </Badge>
            </Row>
            <Row label="Catégorie">{task.category ?? "—"}</Row>
            <Row label="Récurrence">
              <span className="inline-flex items-center gap-1.5">
                <Repeat className="size-4" /> {RECURRENCE_LABELS[task.recurrence ?? "none"]}
              </span>
            </Row>
            <Row label="Rappel">
              <span className="inline-flex items-center gap-1.5">
                <Bell className="size-4" /> {REMINDER_LABELS[task.reminder ?? "none"]}
              </span>
            </Row>
            <Row label="Estimation">
              <span className="inline-flex items-center gap-1.5">
                <Timer className="size-4" />
                {task.estimate ? `${task.estimate} min` : "Non estimée"}
              </span>
            </Row>
            {task.completedAt && (
              <Row label="Terminée le">{new Date(task.completedAt).toLocaleString("fr-FR")}</Row>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 md:p-6">
          <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                toggleTask(task.id);
                toast.success(task.done ? "Tâche décochée" : "Tâche terminée 🎉");
              }}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm rounded-lg transition-colors ${
                task.done
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:brightness-110"
              }`}
            >
              {task.done ? (
                <>
                  <Circle className="size-4" /> Marquer comme à faire
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" /> Marquer comme terminée
                </>
              )}
            </button>

            <button
              onClick={() => setEditOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <Edit className="size-4" /> Modifier la tâche
            </button>

            {task.type === "call" && (
              <button
                onClick={() => toast.success("Appel en cours...")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <Phone className="size-4" /> Appeler {task.contact}
              </button>
            )}

            {task.type === "email" && (
              <button
                onClick={() => toast.info("Composition d'email...")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <Mail className="size-4" /> Envoyer un email
              </button>
            )}

            {task.type === "linkedin" && (
              <button
                onClick={() => toast.info("Ouverture de LinkedIn...")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <Linkedin className="size-4" /> Ouvrir LinkedIn
              </button>
            )}

            <button
              onClick={() => {
                addActivity("Note ajoutée", `Pour la tâche "${task.title}"`);
                toast.success("Note ajoutée");
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <MessageSquare className="size-4" /> Ajouter une note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
