// frontend/components/companies/companies-filters.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Building2, Target } from "@/components/icons";
import { MobileFilterSheet } from "@/components/mobile/mobile-filter-sheet";
import { SearchSelect } from "@/components/common/search-select";
import { cn } from "@/lib/core/utils";
import {
  PAGE_SIZE_OPTIONS,
  industries,
  intents,
  intentLabels,
  type CompanySortBy,
} from "@/lib/companies/preferences";

export type FilterOption = { value: string; label: string };

export function FilterDropdown({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  allLabel,
  width = 240,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  options: FilterOption[];
  onChange: (v: string) => void;
  allLabel: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const computeStyle = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    setStyle({
      position: "fixed",
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? vh - r.top + 4 : undefined,
      left: Math.max(8, Math.min(r.left, vw - width - 8)),
      width,
      maxHeight: Math.min(360, openUp ? spaceAbove - 4 : spaceBelow - 4),
      zIndex: 9999,
    });
  }, [width]);

  useEffect(() => {
    if (!open) return;
    computeStyle();
    const onResize = () => computeStyle();
    const onScroll = () => computeStyle();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, computeStyle]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
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

  const current = options.find((o) => o.value === value);
  const displayLabel = value === options[0]?.value ? allLabel : (current?.label ?? allLabel);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background h-10",
          "px-3 text-xs md:text-sm font-medium transition-colors hover:bg-surface",
          open && "border-primary/50 bg-primary/5",
        )}
      >
        {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium truncate max-w-[140px]">{displayLabel}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        style &&
        createPortal(
          <div
            ref={panelRef}
            style={style}
            className="overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95 p-1"
          >
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {label}
            </p>
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                    selected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-surface",
                  )}
                >
                  {selected ? (
                    <Check className="size-3 shrink-0" />
                  ) : (
                    <span className="size-3 shrink-0" />
                  )}
                  <span className="truncate">
                    {o.value === options[0]?.value ? allLabel : o.label}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const options = useMemo(
    () => PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` })),
    [],
  );

  return (
    <div className="min-w-[140px]">
      <SearchSelect
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
        options={options}
        placeholder="10 / page"
        searchPlaceholder="5, 10, 25, 50…"
        title="Lignes par page"
        minPanelWidth={180}
        maxPanelWidth={220}
      />
    </div>
  );
}

export function MobileFilterSheetLocal({
  open,
  onOpenChange,
  industry,
  setIndustry,
  intent,
  setIntent,
  minEmployees,
  setMinEmployees,
  sortBy,
  setSortBy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  industry: string;
  setIndustry: (v: string) => void;
  intent: string;
  setIntent: (v: string) => void;
  minEmployees: number;
  setMinEmployees: (v: number) => void;
  sortBy: CompanySortBy;
  setSortBy: (v: CompanySortBy) => void;
}) {
  return (
    <MobileFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filtres"
      sections={[
        {
          key: "industry",
          label: "Industrie",
          mode: "single",
          scrollable: true,
          options: industries.map((i) => ({
            value: i,
            label: i === "Tous" ? "Toutes les industries" : i,
          })),
        },
        {
          key: "intent",
          label: "Intention",
          mode: "single",
          options: intents.map((i) => ({
            value: i,
            label: i === "Tous" ? "Toutes les intentions" : (intentLabels[i] ?? i),
          })),
        },
        {
          key: "minEmployees",
          label: "Effectif minimum",
          mode: "single",
          options: [
            { value: "0", label: "Tous" },
            { value: "10", label: "≥ 10" },
            { value: "50", label: "≥ 50" },
            { value: "200", label: "≥ 200" },
            { value: "500", label: "≥ 500" },
            { value: "1000", label: "≥ 1 000" },
          ],
        },
        {
          key: "sortBy",
          label: "Trier par",
          mode: "single",
          options: [
            { value: "name", label: "Nom (A → Z)" },
            { value: "employees", label: "Effectif décroissant" },
            { value: "revenue", label: "Revenu décroissant" },
            { value: "intent", label: "Intention (chaudes d'abord)" },
            { value: "manual", label: "Manuel (drag)" },
          ],
        },
      ]}
      value={{
        industry,
        intent,
        minEmployees: String(minEmployees),
        sortBy,
      }}
      onApply={(v) => {
        setIndustry((v.industry as string) ?? "Tous");
        setIntent((v.intent as string) ?? "Tous");
        setMinEmployees(Number(v.minEmployees ?? 0) || 0);
        setSortBy((v.sortBy as CompanySortBy) ?? "name");
      }}
    />
  );
}

export { Building2, Target };
export { industries, intents, intentLabels };
