// frontend/components/dashboard/dashboard-kpis.tsx

import { useId, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Area, AreaChart } from "recharts";
import { ArrowUpRight, TrendingDown, TrendingUp } from "@/components/icons";
import { ClientChart } from "@/components/charts/charts";
import { SmartCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/core/utils";
import type { DashboardKpi, Tone } from "@/lib/analytics/dashboard-insights";

const TONE_VAR: Record<Tone, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning, var(--chart-2))",
  destructive: "var(--destructive)",
};

function Sparkline({ values }: { values: number[] }) {
  const id = useId().replace(/:/g, "");
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ClientChart height={40}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--kpi-tone)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--kpi-tone)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke="var(--kpi-tone)"
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ClientChart>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
        up ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
      )}
      title="Variation entre la première et la seconde moitié de la période"
    >
      <Icon className="size-2.5" />
      {up ? "+" : ""}
      {delta}&nbsp;%
    </span>
  );
}

function KpiCard({ kpi, delay }: { kpi: DashboardKpi; delay: number }) {
  return (
    <Link
      to={kpi.href}
      style={{ "--kpi-tone": TONE_VAR[kpi.tone] } as CSSProperties}
      className={cn(
        "group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--kpi-tone)_45%,var(--border))] hover:shadow-float",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full opacity-[0.10] blur-2xl transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: "var(--kpi-tone)" }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-muted-foreground">
          {kpi.label}
        </p>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-[var(--kpi-tone)]" />
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <p className="whitespace-nowrap font-display text-[30px] leading-none tracking-tight tabular-nums">
          <SmartCounter text={kpi.value} delay={delay} />
        </p>
        {kpi.trend && <DeltaChip delta={kpi.trend.delta} />}
      </div>

      <div className="relative min-h-10">
        {kpi.trend ? (
          <Sparkline values={kpi.trend.values} />
        ) : (
          <div className="flex h-10 items-end">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.min(100, Math.max(kpi.ratio ? 4 : 0, kpi.ratio ?? 0))}%`,
                  backgroundColor: "var(--kpi-tone)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="relative text-xs leading-snug text-muted-foreground">{kpi.hint}</p>
    </Link>
  );
}

export function KpiStrip({ items }: { items: DashboardKpi[] }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @3xl:gap-4 @7xl:grid-cols-6">
        {items.map((kpi, i) => (
          <KpiCard key={kpi.id} kpi={kpi} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}
