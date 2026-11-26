// frontend/components/charts/charts.tsx

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/core/utils";
import "./chart-scroll.css";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

export const AXIS_STYLE = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

export const GRID_COLOR = "color-mix(in oklab, var(--border) 60%, transparent)";

export function ClientChart({ height, children }: { height: number; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="chart-shell w-full animate-pulse bg-surface/40"
        style={{ height }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div style={{ height }} className="chart-shell w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

export function ScrollFrame({
  minWidth = 560,
  fit = "container",
  label = "Données défilables horizontalement",
  className,
  children,
}: {
  minWidth?: number;
  fit?: "container" | "content";
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > 2, end: el.scrollLeft < max - 2 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scrollable = edges.start || edges.end;

  return (
    <div className={cn("chart-scroll-wrap", className)}>
      <span
        aria-hidden
        className="chart-scroll-fade chart-scroll-fade--start"
        data-visible={edges.start}
      />
      <span
        aria-hidden
        className="chart-scroll-fade chart-scroll-fade--end"
        data-visible={edges.end}
      />
      <div
        ref={ref}
        className="chart-scroll"
        role="region"
        aria-label={label}
        tabIndex={scrollable ? 0 : -1}
      >
        <div
          style={
            fit === "content"
              ? { width: "max-content", minWidth: `max(100%, ${minWidth}px)` }
              : { minWidth }
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  actions,
  footer,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("chart-card-atelier min-w-0 flex flex-col p-4 md:p-6", className)}>
      <header className="relative mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2 md:mb-6">
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="text-[15px] font-semibold tracking-tight md:text-base">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground md:text-[13px]">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>

      <div className="relative min-w-0 flex-1">{children}</div>

      {footer && <div className="relative mt-4 border-t border-border/60 pt-4">{footer}</div>}
    </section>
  );
}

export function RangeToggle({
  value,
  onChange,
  options = ["7j", "30j", "90j"],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === o
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

type TooltipRow = { name?: string; value?: number | string; color?: string; dataKey?: string };

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string | number;
  formatter?: (value: number | string, name?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-float">
      {label !== undefined && <p className="mb-1 text-xs font-medium text-foreground">{label}</p>}
      <ul className="space-y-1">
        {payload.map((row, i) => (
          <li key={`${row.dataKey ?? row.name ?? i}`} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: row.color ?? "var(--primary)" }}
            />
            <span className="text-muted-foreground">{row.name}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {formatter && row.value !== undefined
                ? formatter(row.value, row.name)
                : String(row.value ?? "")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
