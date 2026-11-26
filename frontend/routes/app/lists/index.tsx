// frontend/routes/app/lists/index.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core/utils";
import DataTable, { type Column } from "@/components/common/data-table";
import { Plus, Users, Building2, Trash2, Share2, ListChecks } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { CardViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/lists/")({
  head: () => ({ meta: [{ title: "Listes · LeadCortex" }] }),
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
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-medium">{row.name}</p>
                {row.shared && (
                  <Share2
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-label="Partagée"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground md:hidden">
                {row.count} contacts · mise à jour {row.updated}
              </p>
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
      accessor: (row) => <span className="text-[13px] tabular-nums">{row.count}</span>,
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "updated",
      header: "Dernière mise à jour",
      sortable: true,
      accessor: (row) => (
        <span className="text-xs text-muted-foreground">{row.updated}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Ouverture de "${row.name}"`);
            }}
            className="h-8 rounded-lg px-2 text-xs font-medium text-primary hover:bg-surface/70"
          >
            Ouvrir
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteList(row.id);
              toast("Liste supprimée");
            }}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface/70 hover:text-destructive"
            title="Supprimer"
            aria-label={`Supprimer ${row.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
      className: "w-28 md:w-32",
    },
  ];

  if (lists.length === 0) {
    return (
      <div className="max-w-5xl">
        <PageHeader
          eyebrow="Listes"
          title="Vos listes."
          description="Aucune liste pour l'instant"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus /> Nouvelle liste
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md dialog-content">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Nouvelle liste</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[13px] font-medium">
                      Nom
                    </span>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex. CTO industrie"
                      className="mt-1"
                    />
                  </label>
                  <div className="flex gap-2">
                    {(["people", "company"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-[13px] transition-colors",
                          type === t
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:bg-surface/70",
                        )}
                      >
                        {t === "people" ? (
                          <Users className="size-4" />
                        ) : (
                          <Building2 className="size-4" />
                        )}
                        {t === "people" ? "Prospects" : "Entreprises"}
                      </button>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={submit} disabled={!name.trim()}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="relative isolate overflow-hidden rounded-2xl">
          <img
            src="/images/app/lists.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
          />
          <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
            <EmptyState
              icon={ListChecks}
              title="Aucune liste"
              description="Regroupez des prospects ou des entreprises pour les traiter ensemble."
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
        title="Vos listes."
        description={`${lists.length} listes · ${lists.reduce((n, l) => n + l.count, 0)} contacts`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus /> Nouvelle liste
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md dialog-content">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Nouvelle liste</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-[13px] font-medium">
                    Nom
                  </span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. CTO industrie"
                    className="mt-1"
                  />
                </label>
                <div className="flex gap-2">
                  {(["people", "company"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-[13px] transition-colors",
                        type === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:bg-surface/70",
                      )}
                    >
                      {t === "people" ? (
                        <Users className="size-4" />
                      ) : (
                        <Building2 className="size-4" />
                      )}
                      {t === "people" ? "Prospects" : "Entreprises"}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={submit} disabled={!name.trim()}>
                  Créer
                </Button>
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
