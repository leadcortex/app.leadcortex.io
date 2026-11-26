// frontend/components/enrichment/provider-activate-dialog.tsx

import { useState } from "react";
import { Check } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EnrichmentProvider } from "@/lib/enrichment/mock";
import { cn } from "@/lib/core/utils";
import { ProviderBadge } from "./provider-badge";

export function ProviderActivateDialog({
  open,
  onOpenChange,
  providers,
  onActivate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  providers: EnrichmentProvider[];
  onActivate: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (selected.size === 0) return;
    onActivate(Array.from(selected));
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Activer des sources</DialogTitle>
          <DialogDescription>
            Choisissez les sources à ajouter. Vous pourrez changer leur ordre ensuite.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
          {providers.map((p) => {
            const checked = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-surface/70",
                  )}
                >
                  <ProviderBadge slug={p.slug} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {checked && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-surface/70"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Activer{selected.size > 0 ? ` ${selected.size} source${selected.size > 1 ? "s" : ""}` : ""}

          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
