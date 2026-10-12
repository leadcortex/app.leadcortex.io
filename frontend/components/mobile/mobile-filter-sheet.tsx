//frontend\components\mobile\mobile-filter-sheet.tsx
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { cn } from "@/lib/utils";

export type MobileFilterOption = {
  value: string;
  label: string;
  description?: string;
  count?: number;
};

export type MobileFilterSection = {
  key: string;
  label: string;

  mode?: "single" | "multi";
  options: MobileFilterOption[];
};

export type MobileFilterValue = Record<string, string | string[] | null>;

export type MobileFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  sections: MobileFilterSection[];
  value: MobileFilterValue;
  onApply: (value: MobileFilterValue) => void;
  applyLabel?: string;
};

export function MobileFilterSheet({
  open,
  onOpenChange,
  title = "Filtres",
  sections,
  value,
  onApply,
  applyLabel = "Appliquer",
}: MobileFilterSheetProps) {
  const [draft, setDraft] = useState<MobileFilterValue>(value);

  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const section of sections) {
      const v = draft[section.key];
      if (Array.isArray(v)) n += v.length;
      else if (v != null && v !== "") n += 1;
    }
    return n;
  }, [draft, sections]);

  const toggleSingle = (key: string, optionValue: string) => {
    setDraft((prev) => {
      const current = prev[key];

      return { ...prev, [key]: current === optionValue ? null : optionValue };
    });
  };

  const toggleMulti = (key: string, optionValue: string) => {
    setDraft((prev) => {
      const current = prev[key];
      const arr = Array.isArray(current) ? current : [];
      const next = arr.includes(optionValue)
        ? arr.filter((x) => x !== optionValue)
        : [...arr, optionValue];
      return { ...prev, [key]: next.length ? next : null };
    });
  };

  const handleReset = () => {
    const empty: MobileFilterValue = {};
    for (const s of sections) empty[s.key] = s.mode === "multi" ? [] : null;
    setDraft(empty);
  };

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex min-h-0 flex-col overflow-hidden">
        {}
        <div className="min-h-0 flex-1 space-y-4 px-4 pt-2">
          {sections.map((section) => {
            const selected = draft[section.key];
            const isMulti = section.mode === "multi";
            return (
              <section
                key={section.key}
                className="overflow-hidden rounded-2xl border border-border/70 bg-surface/30"
              >
                <h3 className="border-b border-border/60 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {section.label}
                </h3>
                <ul className="divide-y divide-border/50">
                  {section.options.map((opt) => {
                    const active = isMulti
                      ? Array.isArray(selected) && selected.includes(opt.value)
                      : selected === opt.value;
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() =>
                            isMulti
                              ? toggleMulti(section.key, opt.value)
                              : toggleSingle(section.key, opt.value)
                          }
                          className={cn(
                            "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                            "active:bg-surface/70",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] text-foreground">
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                                {opt.description}
                              </span>
                            )}
                          </span>
                          {opt.count !== undefined && (
                            <span className="shrink-0 text-[12.5px] tabular-nums text-muted-foreground">
                              {opt.count}
                            </span>
                          )}
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-6 shrink-0 place-items-center border transition-colors",
                              isMulti ? "rounded-md" : "rounded-full",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
                            )}
                          >
                            {active && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {}
        <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={activeCount === 0}
              className={cn(
                "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-border px-4",
                "text-[14px] font-medium text-foreground transition-colors active:bg-surface",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              <RotateCcw className="size-4" strokeWidth={2} />
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={cn(
                "inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-primary",
                "text-[15px] font-semibold text-primary-foreground transition-colors active:bg-primary/90",
              )}
            >
              <span className="truncate">
                {applyLabel}
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </span>
            </button>
          </div>
        </div>
      </div>
    </MobileSheet>
  );
}
