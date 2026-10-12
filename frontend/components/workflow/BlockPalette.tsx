//frontend\components\workflow\BlockPalette.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, LayoutGrid } from "lucide-react";
import {
  BLOCKS,
  CATEGORIES,
  type CategoryKey,
  type BlockDef,
} from "@/data/workflow-blocks-catalog";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function BlockPalette({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (blockId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCat("all");
      const coarse =
        typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
      if (!coarse) setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const countsByCategory = useMemo(() => {
    const map = new Map<CategoryKey, number>();
    for (const b of BLOCKS) map.set(b.category, (map.get(b.category) ?? 0) + 1);
    return map;
  }, []);

  const needle = q.trim().toLowerCase();
  const isSearching = needle.length > 0;

  const filtered = useMemo(() => {
    return BLOCKS.filter(
      (b) =>
        (cat === "all" || b.category === cat) &&
        (!needle ||
          b.title.toLowerCase().includes(needle) ||
          b.subtitle.toLowerCase().includes(needle) ||
          (b.tags ?? []).some((t) => t.toLowerCase().includes(needle))),
    ).slice(0, 300);
  }, [needle, cat]);

  const groups = useMemo(() => {
    if (cat !== "all" || isSearching) {
      return [{ category: null as CategoryKey | null, blocks: filtered }];
    }
    const byCat = new Map<CategoryKey, BlockDef[]>();
    for (const b of filtered) {
      if (!byCat.has(b.category)) byCat.set(b.category, []);
      byCat.get(b.category)!.push(b);
    }
    return CATEGORIES.filter((c) => byCat.has(c.key)).map((c) => ({
      category: c.key,
      blocks: byCat.get(c.key)!,
    }));
  }, [filtered, cat, isSearching]);

  const flatResults = useMemo(() => groups.flatMap((g) => g.blocks), [groups]);

  const pick = (id: string) => {
    onPick(id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex h-[90dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[76vh] sm:max-w-[920px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Ajouter un bloc</DialogTitle>

        {}
        <div className="flex shrink-0 items-center gap-2 border-b border-border py-2 pl-3 pr-14">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && flatResults[0]) {
                pick(flatResults[0].id);
              }
            }}
            placeholder="Rechercher un bloc… (Entrée pour insérer le premier résultat)"
            className="h-7 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>

        {}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
          {}
          <aside className="hidden w-[196px] shrink-0 overflow-y-auto border-r border-border py-1.5 sm:block">
            <button
              type="button"
              onClick={() => setCat("all")}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors",
                cat === "all"
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">Tout</span>
              <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
                {BLOCKS.length}
              </span>
            </button>
            <div className="my-1 h-px bg-border" />
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const count = countsByCategory.get(c.key) ?? 0;
              if (!count) return null;
              const active = cat === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  style={active ? { background: `${c.color}1a` } : undefined}
                >
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-sm"
                    style={{ color: c.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </aside>

          <div className="wf-hscroll flex w-full min-w-0 shrink-0 flex-nowrap gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border px-2 py-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => setCat("all")}
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10.5px]",
                cat === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              Tout ({BLOCKS.length})
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px]",
                  cat === c.key ? "text-background" : "text-muted-foreground hover:bg-accent",
                )}
                style={cat === c.key ? { background: c.color, color: "#08090c" } : undefined}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {groups.map((group, gi) => {
              const c = group.category ? CATEGORIES.find((x) => x.key === group.category) : null;
              return (
                <div key={group.category ?? "flat"} className={cn(gi > 0 && "mt-3")}>
                  {c && (
                    <div className="mb-1.5 flex items-center gap-1.5 px-1">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground/70">
                        ({group.blocks.length})
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {group.blocks.map((b) => {
                      const bc = CATEGORIES.find((x) => x.key === b.category)!;
                      const Icon = b.icon;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => pick(b.id)}
                          className="group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-md border border-transparent p-2 text-left hover:border-border hover:bg-accent"
                        >
                          <span
                            className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded"
                            style={{ background: `${bc.color}25`, color: bc.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-medium">
                              {b.title}
                            </span>
                            <span className="block truncate text-[10.5px] text-muted-foreground">
                              {b.subtitle}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!flatResults.length && (
              <p className="p-4 text-center text-[12px] text-muted-foreground">
                Aucun bloc trouvé.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
