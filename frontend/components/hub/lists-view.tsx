// frontend/components/hub/lists-view.tsx

import { useState } from "react";
import {
  Building2,
  ListChecks,
  Plus,
  Share2,
  Trash2,
  Users,
} from "@/components/icons";
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
import { cn } from "@/lib/core/utils";

export function ListsView() {
  const { lists, addList, deleteList } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"people" | "company">("people");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Nom requis");
      return;
    }
    addList(name.trim(), type);
    toast.success("Liste créée");
    setName("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {lists.length} liste{lists.length > 1 ? "s" : ""} ·{" "}
          {lists.reduce((n, l) => n + l.count, 0)} contacts au total
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90">
              <Plus className="size-3.5" /> Nouvelle liste
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md dialog-content">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Nouvelle liste</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nom
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="CTO industrie…"
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="flex gap-2">
                {(["people", "company"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs transition-colors",
                      type === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-surface",
                    )}
                  >
                    {t === "people" ? <Users className="size-3.5" /> : <Building2 className="size-3.5" />}
                    {t === "people" ? "Prospects" : "Entreprises"}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-lg border border-border px-3 text-xs hover:bg-surface"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                className="h-9 rounded-lg bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
              >
                Créer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/20 p-8 text-center">
          <ListChecks className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-medium">Aucune liste</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Créez des listes pour organiser vos prospects et entreprises.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground"
          >
            <Plus className="size-3.5" /> Créer une liste
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => {
            const Icon = list.type === "people" ? Users : Building2;
            return (
              <article
                key={list.id}
                className="group relative rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{list.name}</p>
                      {list.shared && (
                        <Share2 className="size-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {list.type === "people" ? "Prospects" : "Entreprises"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-surface/30 p-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Contacts
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                      {list.count}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Mise à jour
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {list.updated}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toast.info(`Ouverture de "${list.name}"`)}
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Ouvrir →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteList(list.id);
                      toast("Liste supprimée");
                    }}
                    className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
