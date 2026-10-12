//frontend\components\search-select.tsx
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchSelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;

  keywords?: string;

  group?: string;
};

export type SearchSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  title?: string;
  label?: string;
  variant?: "field" | "chip" | "bare";
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;

  allowCustom?: boolean;

  renderTrigger?: (selected: SearchSelectOption | null, open: boolean) => ReactNode;

  minPanelWidth?: number;

  maxPanelWidth?: number;

  align?: "start" | "end" | "auto";
};

const PANEL_CHROME_PX = 92;

const MIN_LIST_PX = 160;

const MAX_LIST_PX = 320;
// Marge de sécurité par rapport aux bords du viewport.
const VIEWPORT_PADDING = 12;

const GAP_PX = 6;

const FLIP_THRESHOLD_PX = MIN_LIST_PX + PANEL_CHROME_PX;

type PanelRect = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  flip: boolean;
};

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  emptyMessage = "Aucun résultat.",
  title,
  label,
  variant = "field",
  className,
  disabled,
  allowClear,
  allowCustom,
  renderTrigger,
  minPanelWidth = 280,
  maxPanelWidth = 420,
  align = "start",
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<PanelRect | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay =
        `${o.label} ${o.description ?? ""} ${o.value} ${o.keywords ?? ""} ${o.group ?? ""}`.toLowerCase();
      // Multi-token : "fr par" matche "France Paris"
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [options, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchSelectOption[]>();
    for (const opt of filtered) {
      const key = opt.group ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(opt);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const customMatch = useMemo(() => {
    if (!allowCustom) return null;
    const q = query.trim();
    if (!q) return null;
    const exists = options.some((o) => o.label.toLowerCase() === q.toLowerCase());
    return exists ? null : q;
  }, [allowCustom, options, query]);

  /* ---------------------- Positionnement du panneau ------------------- */
  // Calcule la position optimale :
  //   - hauteur disponible sous le trigger vs au-dessus
  //   - flip vers le haut si l'espace inférieur est insuffisant
  //   - maxHeight = espace disponible réel (pour éviter tout débordement)
  const updateRect = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* ------------------------------ Largeur ----------------------------- */
    const width = Math.min(
      Math.max(r.width, minPanelWidth),
      Math.min(maxPanelWidth, vw - VIEWPORT_PADDING * 2),
    );

    /* ------------------------------ Position X -------------------------- */
    let left: number;
    if (align === "end") {
      left = r.right - width;
    } else if (align === "auto") {
      // Si le panneau dépasse à droite, on l'aligne sur le bord droit du trigger.
      left = r.left + width > vw - VIEWPORT_PADDING ? r.right - width : r.left;
    } else {
      left = r.left;
    }
    left = Math.min(Math.max(VIEWPORT_PADDING, left), vw - width - VIEWPORT_PADDING);

    /* ------------------------------ Espaces ----------------------------- */
    const spaceBelow = vh - r.bottom - GAP_PX - VIEWPORT_PADDING;
    const spaceAbove = r.top - GAP_PX - VIEWPORT_PADDING;

    // On flip vers le haut si :
    //  - pas assez d'espace en bas pour afficher un minimum
    //  - et l'espace au-dessus est plus généreux
    const shouldFlip = spaceBelow < FLIP_THRESHOLD_PX && spaceAbove > spaceBelow;

    const available = shouldFlip ? spaceAbove : spaceBelow;

    // On borne la hauteur du panneau entre un minimum confortable et le max
    // souhaité, sans jamais dépasser l'espace réellement disponible.
    const maxHeight = Math.max(
      MIN_LIST_PX + PANEL_CHROME_PX,
      Math.min(MAX_LIST_PX + PANEL_CHROME_PX, available),
    );

    setRect(
      shouldFlip
        ? {
            // Ancré par le bas : le bas du panneau = haut du trigger - gap
            bottom: vh - r.top + GAP_PX,
            left,
            width,
            maxHeight,
            flip: true,
          }
        : {
            // Ancré par le haut : le haut du panneau = bas du trigger + gap
            top: r.bottom + GAP_PX,
            left,
            width,
            maxHeight,
            flip: false,
          },
    );
  }, [minPanelWidth, maxPanelWidth, align]);

  /* ---------------------- Repositionnement réactif -------------------- */
  useEffect(() => {
    if (!open) return;
    updateRect();
    const onScrollOrResize = () => updateRect();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updateRect]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  /* ---------------------- Fermer au clic extérieur -------------------- */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  /* ----------------------------- Trigger ---------------------------- */
  const defaultTrigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={() => setOpen((v) => !v)}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors",
        "hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
        open && "border-primary/50 ring-2 ring-primary/20",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <span className="block truncate text-sm">{selected.label}</span>
          ) : (
            <span className="block truncate text-sm text-muted-foreground">{placeholder}</span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {allowClear && selected && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="size-3" />
          </span>
        )}
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </span>
    </button>
  );

  const triggerNode = renderTrigger ? (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={() => setOpen((v) => !v)}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "transition-colors focus:outline-none",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {renderTrigger(selected, open)}
    </button>
  ) : (
    defaultTrigger
  );

  /* ------------------------------ Panneau ---------------------------- */
  // Le panneau est un flex column :
  //   - header de recherche : flex-shrink-0 (reste en haut, jamais scrollé)
  //   - liste               : flex-1 + overflow-y-auto (seule zone scrollable)
  // `maxHeight` est piloté dynamiquement depuis updateRect().
  const panel =
    open && rect
      ? createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: "fixed",
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width,
              maxHeight: rect.maxHeight,
              zIndex: 9999,
            }}
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-md",
              "animate-in fade-in-0 zoom-in-95",
            )}
          >
            <div className="shrink-0 border-b border-border bg-popover/95 p-2 backdrop-blur">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Effacer la recherche"
                    className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              {title && (
                <p className="px-1 pt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {title}
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
              {filtered.length === 0 && !customMatch && (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </p>
              )}

              {grouped.map(([group, items]) => (
                <div key={group} className="mb-1">
                  {group && (
                    <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {group}
                    </p>
                  )}
                  {items.map((opt) => {
                    const isSel = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        onClick={() => commit(opt.value)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                          isSel
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary/60 text-foreground",
                        )}
                      >
                        {opt.icon && (
                          <span className="grid size-6 shrink-0 place-items-center text-base leading-none">
                            {opt.icon}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium leading-tight">
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">
                              {opt.description}
                            </span>
                          )}
                        </span>
                        {isSel && <Check className="size-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}

              {customMatch && (
                <button
                  type="button"
                  onClick={() => commit(customMatch)}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border px-2.5 py-2 text-left text-foreground transition-colors hover:bg-secondary/60"
                >
                  <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
                    +
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium leading-tight">
                      Créer « {customMatch} »
                    </span>
                    <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">
                      Valeur personnalisée
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      {label && <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>}
      {triggerNode}
      {panel}
    </div>
  );
}
