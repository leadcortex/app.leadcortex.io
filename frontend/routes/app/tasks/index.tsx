// frontend/routes/app/tasks/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import DataTable, { type Column } from "@/components/common/data-table";
import { CustomSelect } from "@/components/common/custom-select";
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
} from "@/components/icons";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import type { Task } from "@/lib/data/mock-data";
import { EmptyState } from "@/components/common/empty-state";
import { TasksListSkeleton } from "@/components/skeletons";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormDialog, type TaskFormValues } from "@/components/tasks/task-form-dialog";
import { cn } from "@/lib/core/utils";
import { Button } from "@/components/ui/button";
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
} from "@/lib/tasks/utils";

export const Route = createFileRoute("/app/tasks/")({
  head: () => ({ meta: [{ title: "Tâches · LeadCortex" }] }),
  pendingComponent: () => <TasksListSkeleton />,
  component: TasksPage,
});

const iconMap = { call: Phone, email: Mail, linkedin: Linkedin, "follow-up": Clock } as const;

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
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTask(row.id);
              }}
              className="shrink-0"
              aria-label={row.done ? "Marquer à faire" : "Marquer terminée"}
            >
              {row.done ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground transition-colors hover:text-primary" />
              )}
            </button>
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "text-[13px] md:text-sm",
                row.done && "text-muted-foreground line-through",
              )}
            >
              {row.title}
            </span>
          </div>
        );
      },
      cellClassName: "min-w-[160px] md:min-w-[220px]",
    },
    {
      key: "contact",
      header: "Contact",
      sortable: true,
      accessor: (row) => (row.contact === "—" ? "" : row.contact),
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
        <span className="text-xs text-muted-foreground">{PRIORITY_LABELS[row.priority]}</span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      accessor: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.done ? "Terminée" : STATUS_LABELS[row.status ?? "todo"]}
        </span>
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
          className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-secondary"
          aria-label="Supprimer"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </button>
      ),
      className: "w-10",
      cellClassName: "text-center",
    },
  ];

  const createTrigger = (
    <Button>
      <Plus /> Créer une tâche
    </Button>
  );

  if (tasks.length === 0) {
    return (
      <div className="max-w-6xl">
        <PageHeader
          eyebrow="Tâches"
          title="Ce qu'il vous reste à faire."
          actions={<TaskFormDialog trigger={createTrigger} onSubmit={create} />}
        />
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche pour l'instant"
          action={{
            label: "Créer une tâche",
            onClick: () => {
              toast.info("Ouvrir le dialogue de création");
            },
            icon: Plus,
          }}
        />
      </div>
    );
  }

  const summary = [
    `${openCount} à faire`,
    todayCount > 0 ? `${todayCount} aujourd'hui` : null,
    overdueCount > 0 ? `${overdueCount} en retard` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Tâches"
        title="Ce qu'il vous reste à faire."
        description={summary}
        actions={<TaskFormDialog trigger={createTrigger} onSubmit={create} />}
      />

      <div className="mb-6 space-y-3 md:mb-8">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une tâche, un contact, une étiquette…"
              aria-label="Rechercher une tâche"
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 md:h-9"
            />
          </div>
          <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-surface/40 p-0.5">
            {(
              [
                { key: "list", label: "Liste", icon: LayoutList },
                { key: "table", label: "Tableau", icon: TableIcon },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                aria-pressed={view === v.key}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] transition-colors",
                  view === v.key
                    ? "bg-background font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="size-4" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        <EmptyState size="sm" title="Aucune tâche ne correspond à ces filtres." />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-[13px] font-semibold">
                {group.label}
                <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                  {group.items.length}
                </span>
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {group.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => {
                      toggleTask(task.id);
                      toast.success(task.done ? "Tâche rouverte" : "Tâche terminée");
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
