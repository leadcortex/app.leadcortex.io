//frontend\routes\app.tasks.tsx
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { CustomSelect } from "@/components/custom-select";
import {
  CheckCircle2,
  Circle,
  Plus,
  Phone,
  Mail,
  Linkedin,
  Clock,
  Trash2,
  CheckSquare,
  Search,
  LayoutList,
  Table as TableIcon,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/mock-data";
import { EmptyState } from "@/components/empty-state";
import { TasksListSkeleton } from "@/components/skeletons";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormDialog, type TaskFormValues } from "@/components/tasks/task-form-dialog";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TYPE_LABELS,
  dueLabel,
  dueState,
  groupTasks,
  sortTasks,
  type SortKey,
} from "@/lib/task-utils";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({ meta: [{ title: "Tâches — LeadCortex" }] }),
  pendingComponent: () => <TasksListSkeleton />,
  component: TasksPage,
});

const iconMap = { call: Phone, email: Mail, linkedin: Linkedin, "follow-up": Clock } as const;

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger" | "primary" | "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 md:px-4 md:py-3">
      <p
        className={cn(
          "font-display text-xl md:text-2xl italic leading-none",
          tone === "danger" && "text-red-600",
          tone === "primary" && "text-primary",
          tone === "success" && "text-emerald-600",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TasksPage() {
  const { tasks, toggleTask, deleteTask, addTask, updateTask, toggleSubtask, addActivity } =
    useAppStore();

  const [status, setStatus] = useState<"all" | "open" | "done" | "overdue">("all");
  const [priority, setPriority] = useState<"all" | Task["priority"]>("all");
  const [type, setType] = useState<"all" | Task["type"]>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [view, setView] = useState<"list" | "table">("list");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;
  const overdueCount = tasks.filter((t) => !t.done && dueState(t) === "overdue").length;
  const todayCount = tasks.filter((t) => !t.done && dueState(t) === "today").length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      if (status === "open" && t.done) return false;
      if (status === "done" && !t.done) return false;
      if (status === "overdue" && (t.done || dueState(t) !== "overdue")) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && (t.category ?? "") !== category) return false;
      if (!q) return true;
      return [t.title, t.contact, t.description ?? "", ...(t.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return sortTasks(filtered, sort);
  }, [tasks, status, priority, type, category, sort, query]);

  const groups = useMemo(() => groupTasks(visible), [visible]);

  const create = (values: TaskFormValues) => {
    addTask(values);
    addActivity("Tâche créée", values.title);
    toast.success("Tâche ajoutée");
  };

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Tâche",
      sortable: true,
      accessor: (row) => {
        const Icon = iconMap[row.type];
        return (
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTask(row.id);
              }}
              className="shrink-0"
            >
              {row.done ? (
                <CheckCircle2 className="size-3.5 md:size-4 text-primary" />
              ) : (
                <Circle className="size-3.5 md:size-4 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            <div className="size-5 md:size-7 rounded-md bg-secondary grid place-items-center shrink-0">
              <Icon className="size-2.5 md:size-3.5 text-muted-foreground" />
            </div>
            <span
              className={
                row.done
                  ? "line-through text-muted-foreground text-xs md:text-sm"
                  : "text-xs md:text-sm"
              }
            >
              {row.title}
            </span>
          </div>
        );
      },
      cellClassName: "min-w-[120px] md:min-w-[200px]",
    },
    {
      key: "contact",
      header: "Contact",
      sortable: true,
      accessor: (row) => row.contact,
      hideOnMobile: true,
    },
    {
      key: "due",
      header: "Échéance",
      sortable: true,
      accessor: (row) => (
        <Badge
          tone={
            !row.done && dueState(row) === "overdue"
              ? "destructive"
              : dueState(row) === "today"
                ? "primary"
                : "muted"
          }
        >
          {dueLabel(row)}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priorité",
      sortable: true,
      accessor: (row) => (
        <Badge
          tone={row.priority === "high" ? "primary" : row.priority === "med" ? "warning" : "muted"}
        >
          {PRIORITY_LABELS[row.priority]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      accessor: (row) => (
        <Badge tone={row.done ? "success" : "muted"}>
          {row.done ? "Terminée" : STATUS_LABELS[row.status ?? "todo"]}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(row.id);
            toast("Tâche supprimée");
          }}
          className="p-0.5 md:p-1 rounded hover:bg-secondary transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 className="size-3 md:size-3.5 text-muted-foreground" />
        </button>
      ),
      className: "w-6 md:w-8",
      cellClassName: "text-center",
    },
  ];

  const createTrigger = (
    <button className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all">
      <Plus className="size-3 md:size-3.5" /> Créer une tâche
    </button>
  );

  if (tasks.length === 0) {
    return (
      <div className="max-w-6xl">
        <PageHeader
          eyebrow="Tâches"
          title="Ce qu'il vous reste à faire."
          description="0 en cours · 0 terminées"
          actions={<TaskFormDialog trigger={createTrigger} onSubmit={create} />}
        />
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche"
          description="Créez votre première tâche pour rester organisé."
          action={{
            label: "Créer une tâche",
            onClick: () => {
              toast.info("Ouvrir le dialogue de création");
            },
            icon: Plus,
          }}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Tâches"
        title="Ce qu'il vous reste à faire."
        description={`${openCount} en cours · ${doneCount} terminées`}
        actions={<TaskFormDialog trigger={createTrigger} onSubmit={create} />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <Stat label="En cours" value={openCount} />
        <Stat label="Aujourd'hui" value={todayCount} tone="primary" />
        <Stat label="En retard" value={overdueCount} tone="danger" />
        <Stat label="Terminées" value={doneCount} tone="success" />
      </div>

      <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une tâche, un contact, une étiquette…"
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border p-0.5 w-fit bg-surface/40">
            {(
              [
                { key: "list", label: "Liste", icon: LayoutList },
                { key: "table", label: "Tableau", icon: TableIcon },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] md:text-xs rounded-lg transition-colors",
                  view === v.key
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="size-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <CustomSelect
            label="Statut"
            title="Statut"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "all", label: "Toutes" },
              { value: "open", label: "À faire" },
              { value: "overdue", label: "En retard" },
              { value: "done", label: "Terminées" },
            ]}
          />
          <CustomSelect
            label="Priorité"
            title="Priorité"
            value={priority}
            onChange={(v) => setPriority(v as typeof priority)}
            options={[
              { value: "all", label: "Toutes" },
              ...(["high", "med", "low"] as const).map((p) => ({
                value: p,
                label: PRIORITY_LABELS[p],
              })),
            ]}
          />
          <CustomSelect
            label="Type"
            title="Type"
            value={type}
            onChange={(v) => setType(v as typeof type)}
            options={[
              { value: "all", label: "Tous" },
              ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
          <CustomSelect
            label="Catégorie"
            title="Catégorie"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "Toutes" },
              ...TASK_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
          <CustomSelect
            label="Tri"
            title="Trier par"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "due", label: "Échéance" },
              { value: "priority", label: "Priorité" },
              { value: "created", label: "Création" },
              { value: "alpha", label: "Alphabétique" },
            ]}
          />
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          data={visible}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectedIds={selectedIds}
          onSelectRow={(id, selected) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (selected) next.add(id);
              else next.delete(id);
              return next;
            });
          }}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedIds(new Set(visible.map((t) => t.id)));
            } else {
              setSelectedIds(new Set());
            }
          }}
          pageSize={10}
          showPagination={true}
          showSearch={true}
          searchPlaceholder="Nom de la tâche, contact..."
          searchFields={["title", "contact"]}
          emptyMessage="Aucune tâche."
        />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <AlertTriangle className="size-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucune tâche ne correspond à ces filtres.</p>
        </div>
      ) : (
        <div className="space-y-5 md:space-y-7">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <h2 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {group.label}
                </h2>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {group.items.length}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2 md:space-y-2.5">
                {group.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => {
                      toggleTask(task.id);
                      toast.success(task.done ? "Tâche décochée" : "Tâche terminée 🎉");
                    }}
                    onDelete={() => {
                      deleteTask(task.id);
                      toast("Tâche supprimée");
                    }}
                    onEdit={() => {
                      setEditing(task);
                      setEditOpen(true);
                    }}
                    onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <TaskFormDialog
          mode="edit"
          task={editing}
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditing(null);
          }}
          trigger={<span className="hidden" />}
          onSubmit={(values) => {
            updateTask(editing.id, values);
            toast.success("Tâche mise à jour");
          }}
        />
      )}
    </div>
  );
}
