//frontend\components\enrichment\provider-activate-dialog.tsx
import { useState } from "react";
import { Check, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EnrichmentProvider } from "@/lib/enrichment-mock";
import { cn } from "@/lib/utils";
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
          <DialogTitle className="text-base md:text-lg">Activer un provider</DialogTitle>
          <DialogDescription>
            Sélectionnez les sources à brancher au waterfall. L'ordre pourra être ajusté ensuite.
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
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-surface/60",
                  )}
                >
                  <ProviderBadge slug={p.slug} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
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
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Zap className="size-3.5" /> Activer {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
