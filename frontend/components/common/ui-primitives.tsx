// frontend/components/common/ui-primitives.tsx

import React, { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Check, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { SmartCounter } from "@/components/ui/animated-counter";

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
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4 md:gap-6">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl md:text-4xl italic mt-1">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-prose">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
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
    <div className="kpi-tactile flex min-w-0 flex-col gap-1 p-4">
      <p className="kpi-label truncate">{label}</p>
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="kpi-value truncate text-xl md:text-3xl">
          <SmartCounter text={value} />
        </p>
        {delta && (
          <span className={cn("kpi-delta", !up && "kpi-delta--down")}>
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="kpi-sub truncate">{sub}</p>}
    </div>
  );
}

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
      className={`inline-flex items-center gap-1 text-[11px] md:text-xs px-2 py-0.5 rounded-full font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="table-tactile overflow-hidden">
      <div className="table-tactile__scroll table-scroll">{children}</div>
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 md:p-8 text-center text-sm text-muted-foreground">
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
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-foreground/25 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="size-4 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-float max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-surface"
              onClick={() => handleSelect(option)}
            >
              <span className="truncate">{option.label}</span>
              {option.value === selectedOption?.value && (
                <Check className="size-4 text-primary shrink-0" />
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
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        {help ? <span className="text-xs text-muted-foreground">{help}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}
