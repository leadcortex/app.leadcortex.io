//frontend\components\charts.tsx
/**
 * Primitives de data-visualisation partagées (Dashboard & Analytics).
 *
 * Règles :
 * - Aucune couleur en dur : uniquement les tokens du design system
 *   (var(--chart-1..6), var(--primary), var(--border), ...).
 * - Les graphiques ne sont rendus qu'après montage client (Recharts mesure le
 *   DOM) ; côté serveur on affiche un placeholder de même hauteur pour éviter
 *   tout saut de mise en page.
 * - Sur mobile, les graphiques denses ne sont jamais compressés : ils sont
 *   placés dans <ScrollFrame> qui applique une largeur minimale et un scroll
 *   horizontal fluide à barre invisible (utilitaire `scrollbar-hide`).
 */
import { useEffect, useState, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

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

export const GRID_COLOR = "color-mix(in oklab, var(--border) 90%, transparent)";

export function ClientChart({ height, children }: { height: number; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="w-full animate-pulse rounded-lg bg-surface/60"
        style={{ height }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

export function ScrollFrame({
  minWidth = 560,
  children,
}: {
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 scrollbar-hide">
      <div style={{ minWidth }}>{children}</div>
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
    <section
      className={`min-w-0 flex flex-col rounded-2xl border border-border bg-background p-4 md:p-6 ${className}`}
    >
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 md:mb-6">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold md:text-base">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
      {footer && <div className="mt-4 border-t border-border pt-3">{footer}</div>}
    </section>
  );
}

/** Sélecteur de plage (7j / 30j / 90j) — purement visuel côté présentation. */
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
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface/60 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors md:text-xs ${
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

/** Tooltip harmonisé, utilisé par tous les graphiques. */
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
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-float backdrop-blur">
      {label !== undefined && (
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      )}
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

/** Légende compacte réutilisable. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
