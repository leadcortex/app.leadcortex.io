//frontend\routes\app.lists.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { Plus, Users, Building2, Trash2, Share2, ListChecks } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { CardViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/lists")({
  head: () => ({ meta: [{ title: "Listes — LeadCortex" }] }),
  pendingComponent: () => <CardViewSkeleton label="Chargement des listes" cards={6} />,
  component: ListsPage,
});

function ListsPage() {
  const navigate = useNavigate();
  const { lists, addList, deleteList } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"people" | "company">("people");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const submit = () => {
    if (!name.trim()) {
      toast.error("Nom requis");
      return;
    }
    addList(name, type);
    toast.success("Liste créée");
    setName("");
    setOpen(false);
  };

  const columns: Column<(typeof lists)[number]>[] = [
    {
      key: "name",
      header: "Liste",
      sortable: true,
      accessor: (row) => {
        const Icon = row.type === "people" ? Users : Building2;
        return (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="size-7 md:size-9 rounded-lg bg-primary/8 text-primary grid place-items-center shrink-0">
              <Icon className="size-3.5 md:size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2">
                <p className="font-medium text-xs md:text-sm truncate">{row.name}</p>
                {row.shared && (
                  <Share2 className="size-2.5 md:size-3 text-muted-foreground shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-3 text-[9px] md:text-xs text-muted-foreground mt-0.5">
                <span>{row.count} contacts</span>
                <span>·</span>
                <span>Mise à jour {row.updated}</span>
              </div>
            </div>
          </div>
        );
      },
      cellClassName: "min-w-[180px] md:min-w-[250px]",
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      accessor: (row) => (
        <Badge tone="muted">{row.type === "people" ? "Prospects" : "Entreprises"}</Badge>
      ),
    },
    {
      key: "count",
      header: "Contacts",
      sortable: true,
      accessor: (row) => <span className="font-mono text-xs md:text-sm">{row.count}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "updated",
      header: "Dernière mise à jour",
      sortable: true,
      accessor: (row) => (
        <span className="text-[9px] md:text-xs text-muted-foreground">{row.updated}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1 md:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Ouverture de "${row.name}"`);
            }}
            className="text-[10px] md:text-xs text-primary hover:underline"
          >
            Ouvrir →
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteList(row.id);
              toast("Liste supprimée");
            }}
            className="p-0.5 md:p-1 rounded hover:bg-secondary transition-colors"
            title="Supprimer"
          >
            <Trash2 className="size-3 md:size-3.5 text-muted-foreground" />
          </button>
        </div>
      ),
      className: "w-20 md:w-32",
    },
  ];

  if (lists.length === 0) {
    return (
      <div className="max-w-5xl">
        <PageHeader
          eyebrow="Listes"
          title="Vos listes de travail."
          description="0 liste · 0 contacts"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all">
                  <Plus className="size-3 md:size-3.5" /> Nouvelle liste
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md dialog-content">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">Nouvelle liste</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Nom
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="CTO industrie..."
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 md:px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <div className="flex gap-1.5 md:gap-2">
                    {(["people", "company"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 md:gap-2 py-1.5 md:py-2 rounded-md border text-[10px] md:text-xs ${
                          type === t
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {t === "people" ? (
                          <Users className="size-3 md:size-3.5" />
                        ) : (
                          <Building2 className="size-3 md:size-3.5" />
                        )}
                        {t === "people" ? "Prospects" : "Entreprises"}
                      </button>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs border border-border rounded-md hover:bg-surface"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submit}
                    className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90"
                  >
                    Créer
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="relative isolate overflow-hidden rounded-2xl">
          <img
            src="/images/Listes.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
          />
          <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
            <EmptyState
              icon={ListChecks}
              title="Aucune liste"
              description="Créez des listes pour organiser vos prospects et entreprises."
              action={{
                label: "Créer une liste",
                onClick: () => setOpen(true),
                icon: Plus,
              }}
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Listes"
        title="Vos listes de travail."
        description={`${lists.length} listes · ${lists.reduce((n, l) => n + l.count, 0)} contacts au total`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all">
                <Plus className="size-3 md:size-3.5" /> Nouvelle liste
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md dialog-content">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">Nouvelle liste</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Nom
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CTO industrie..."
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 md:px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <div className="flex gap-1.5 md:gap-2">
                  {(["people", "company"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 md:gap-2 py-1.5 md:py-2 rounded-md border text-[10px] md:text-xs ${
                        type === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {t === "people" ? (
                        <Users className="size-3 md:size-3.5" />
                      ) : (
                        <Building2 className="size-3 md:size-3.5" />
                      )}
                      {t === "people" ? "Prospects" : "Entreprises"}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setOpen(false)}
                  className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs border border-border rounded-md hover:bg-surface"
                >
                  Annuler
                </button>
                <button
                  onClick={submit}
                  className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90"
                >
                  Créer
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        data={lists}
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
            setSelectedIds(new Set(lists.map((l) => l.id)));
          } else {
            setSelectedIds(new Set());
          }
        }}
        pageSize={10}
        showPagination={true}
        showSearch={true}
        searchPlaceholder="Nom de la liste..."
        searchFields={["name"]}
        emptyMessage="Aucune liste créée."
      />
    </div>
  );
}
