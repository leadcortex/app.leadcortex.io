//frontend\components\ui-primitives.tsx
import React, { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Check, ChevronDown } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-8 animate-fade-in-up gap-3 md:gap-6">
      <div className="min-w-0">
        <p className="text-[10px] md:text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl md:text-4xl italic mt-1">{title}</h1>
        {description && (
          <p className="mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function Kpi({
  label,
  value,
  delta,
  up,
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 md:p-4 kpi-card">
      <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <div className="mt-1 md:mt-1.5 flex items-baseline justify-between gap-2">
        <p className="font-display text-xl md:text-3xl">{value}</p>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] md:text-xs ${up ? "text-primary" : "text-muted-foreground"}`}
          >
            {up ? (
              <TrendingUp className="size-2.5 md:size-3" />
            ) : (
              <TrendingDown className="size-2.5 md:size-3" />
            )}
            {delta}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 md:mt-1">{sub}</p>
      )}
    </div>
  );
}

/**
 * Badge — les tons s'appuient uniquement sur les tokens du design system
 * (primary / success / warning / destructive / muted) pour basculer
 * automatiquement entre thème clair et thème sombre. Aucune couleur
 * arbitraire (bg-amber-50, text-emerald-700…) : les variantes sombres sont
 * donc inutiles, tout suit --success, --warning, etc.
 */
export function Badge({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: "bg-secondary text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/14 text-warning",
    destructive: "bg-destructive/12 text-destructive",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full uppercase font-semibold tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3 md:mb-4 animate-fade-in-up">
      {children}
    </div>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background animate-fade-in-up">
      <div className="overflow-x-auto scrollbar-hide table-scroll">{children}</div>
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/30 p-6 md:p-8 text-center text-xs md:text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "h-4 w-7" : "h-5 w-9";
  const knob = size === "sm" ? "size-3" : "size-3.5";
  const translate = size === "sm" ? "translate-x-3" : "translate-x-4";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${dims} items-center rounded-full transition-colors shrink-0 ${
        checked ? "bg-primary" : "bg-secondary"
      }`}
    >
      <span
        className={`inline-block ${knob} rounded-full bg-background shadow-sm transform transition-transform ${
          checked ? translate : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionnez une option",
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<
    { value: string; label: string } | undefined
  >(undefined);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const option = options.find((opt) => opt.value === value);
    setSelectedOption(option);
  }, [value, options]);

  const handleSelect = (option: { value: string; label: string }) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className || ""}`} ref={selectRef}>
      <button
        type="button"
        className="flex h-8 md:h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:bg-surface/40"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-3 w-3 md:h-4 md:w-4 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex cursor-pointer items-center justify-between px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm hover:bg-surface"
              onClick={() => handleSelect(option)}
            >
              <span className="truncate">{option.label}</span>
              {option.value === selectedOption?.value && (
                <Check className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {help ? <span className="text-[10px] text-muted-foreground">{help}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}
