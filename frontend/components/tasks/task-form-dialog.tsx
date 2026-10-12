//frontend\components\tasks\task-form-dialog.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomSelect } from "@/components/custom-select";
import { DateTimeField } from "@/components/tasks/date-time-field";
import { cn } from "@/lib/utils";
import type { Subtask, Task } from "@/lib/mock-data";
import {
  PRIORITY_LABELS,
  REMINDER_LABELS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TYPE_LABELS,
  legacyDueLabel,
} from "@/lib/task-utils";

export type TaskFormValues = Omit<Task, "id" | "done">;

type Props = {
  mode?: "create" | "edit";
  task?: Task;
  trigger: ReactNode;
  onSubmit: (values: TaskFormValues) => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:text-[10px]">
        {title}
      </h4>
      {children}
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs placeholder:text-muted-foreground transition-colors focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm";

export function TaskFormDialog({
  mode = "create",
  task,
  trigger,
  onSubmit,
  open: openProp,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState<Task["type"]>("follow-up");
  const [priority, setPriority] = useState<Task["priority"]>("med");
  const [status, setStatus] = useState<NonNullable<Task["status"]>>("todo");
  const [category, setCategory] = useState<string>("Prospection");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [dueTime, setDueTime] = useState<string | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<NonNullable<Task["recurrence"]>>("none");
  const [reminder, setReminder] = useState<NonNullable<Task["reminder"]>>("none");
  const [estimate, setEstimate] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setContact(task?.contact && task.contact !== "—" ? task.contact : "");
    setType(task?.type ?? "follow-up");
    setPriority(task?.priority ?? "med");
    setStatus(task?.status ?? (task?.done ? "done" : "todo"));
    setCategory(task?.category ?? "Prospection");
    setDueDate(task?.dueDate);
    setDueTime(task?.dueTime);
    setRecurrence(task?.recurrence ?? "none");
    setReminder(task?.reminder ?? "none");
    setEstimate(task?.estimate ?? 0);
    setTags(task?.tags ?? []);
    setSubtasks(task?.subtasks ?? []);
    setTagDraft("");
    setSubtaskDraft("");
  }, [open, task]);

  const estimateOptions = useMemo(
    () => [
      { value: "0", label: "Non estimée" },
      { value: "15", label: "15 minutes" },
      { value: "30", label: "30 minutes" },
      { value: "60", label: "1 heure" },
      { value: "120", label: "2 heures" },
      { value: "240", label: "Une demi-journée" },
      { value: "480", label: "Une journée" },
    ],
    [],
  );

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value) return;
    if (!tags.includes(value)) setTags([...tags, value]);
    setTagDraft("");
  };

  const addSubtask = () => {
    const value = subtaskDraft.trim();
    if (!value) return;
    setSubtasks([...subtasks, { id: `st${Date.now()}`, title: value, done: false }]);
    setSubtaskDraft("");
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    const values: TaskFormValues = {
      title: title.trim(),
      description: description.trim(),
      contact: contact.trim() || "—",
      type,
      priority,
      status,
      category,
      due: legacyDueLabel(dueDate, dueTime),
      dueDate,
      dueTime,
      recurrence,
      reminder,
      estimate,
      tags,
      subtasks,
      createdAt: task?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[88vh] sm:max-w-2xl"
        aria-describedby={undefined}
      >
        {/* En-tête — pr-14 au lieu de md:px-6 pour ne pas passer sous le X */}
        <header className="shrink-0 border-b border-border pb-3 pl-4 pr-14 pt-5 md:pl-6 md:pr-14">
          <DialogTitle className="font-display text-xl italic tracking-tight md:text-2xl">
            {mode === "edit" ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
          <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
            Échéance précise, récurrence, sous-tâches, étiquettes — tout est configurable.
          </p>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 md:px-6">
          <Section title="Titre">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rappeler pour la démo…"
              className={inputCls}
            />
          </Section>

          <Section title="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Contexte, objectifs, points à aborder…"
              className={cn(inputCls, "min-h-20 resize-y")}
            />
          </Section>

          <Section title="Priorité">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border p-1">
              {(["low", "med", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-lg py-1.5 text-[11px] transition-colors md:text-xs",
                    priority === p
                      ? "bg-foreground font-medium text-background"
                      : "text-muted-foreground hover:bg-surface",
                  )}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Échéance">
            <DateTimeField
              date={dueDate}
              time={dueTime}
              onDateChange={setDueDate}
              onTimeChange={setDueTime}
            />
          </Section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Section title="Récurrence">
              <CustomSelect
                value={recurrence}
                onChange={(v) => setRecurrence(v as NonNullable<Task["recurrence"]>)}
                title="Récurrence"
                variant="field"
                options={Object.entries(RECURRENCE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Section>
            <Section title="Rappel">
              <CustomSelect
                value={reminder}
                onChange={(v) => setReminder(v as NonNullable<Task["reminder"]>)}
                title="Rappel"
                variant="field"
                options={Object.entries(REMINDER_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Section>
            <Section title="Type">
              <CustomSelect
                value={type}
                onChange={(v) => setType(v as Task["type"])}
                title="Type de tâche"
                variant="field"
                options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Section>
            <Section title="Statut">
              <CustomSelect
                value={status}
                onChange={(v) => setStatus(v as NonNullable<Task["status"]>)}
                title="Statut"
                variant="field"
                options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Section>
            <Section title="Catégorie">
              <CustomSelect
                value={category}
                onChange={setCategory}
                title="Catégorie"
                variant="field"
                options={TASK_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </Section>
            <Section title="Estimation">
              <CustomSelect
                value={String(estimate)}
                onChange={(v) => setEstimate(Number(v))}
                title="Temps estimé"
                variant="field"
                options={estimateOptions}
              />
            </Section>
          </div>

          <Section title="Contact lié">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Jean-Luc Morel"
              className={inputCls}
            />
          </Section>

          <Section title="Étiquettes">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground"
                >
                  <Tag className="size-3 text-muted-foreground" />
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    aria-label={`Retirer ${t}`}
                  >
                    <X className="size-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Ajouter une étiquette puis Entrée"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl border border-border px-3 text-xs transition-colors hover:bg-surface"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Section>

          <Section
            title={`Sous-tâches (${subtasks.filter((s) => s.done).length}/${subtasks.length})`}
          >
            <div className="mb-2 space-y-1.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSubtasks(
                        subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)),
                      )
                    }
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                      s.done ? "border-primary bg-primary" : "border-border hover:border-primary",
                    )}
                    aria-label="Basculer la sous-tâche"
                  >
                    {s.done && <Check className="size-3 text-primary-foreground" />}
                  </button>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs md:text-sm",
                      s.done && "text-muted-foreground line-through",
                    )}
                  >
                    {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))}
                    aria-label="Supprimer la sous-tâche"
                  >
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Ajouter une sous-tâche"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addSubtask}
                className="rounded-xl border border-border px-3 text-xs transition-colors hover:bg-surface"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Section>
        </div>

        <DialogFooter className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:bg-surface"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-foreground px-4 py-2 text-xs text-background transition-opacity hover:opacity-90"
          >
            {mode === "edit" ? "Enregistrer" : "Créer la tâche"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
