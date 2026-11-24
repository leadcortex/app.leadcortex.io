// frontend/components/dashboard/dashboard-charts.tsx

import { useId, useMemo } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "@/components/icons";
import {
  AXIS_STYLE,
  CHART_COLORS,
  ChartCard,
  ChartLegend,
  ChartTooltip,
  ClientChart,
  GRID_COLOR,
  RangeToggle,
  ScrollFrame,
} from "@/components/charts/charts";
import { volumeSeries, type STAGE_LABELS } from "@/lib/analytics/dashboard-metrics";
import {
  formatCompactEuroFr,
  halfDelta,
  type FunnelStep,
  type ScoreBucket,
} from "@/lib/analytics/dashboard-insights";
import { cn } from "@/lib/core/utils";

export type Range = "7j" | "30j" | "90j";

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="whitespace-nowrap font-display text-2xl leading-none tabular-nums md:text-[28px]">
          {value}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={cn(
              "whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums",
              delta > 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta}&nbsp;%
          </span>
        )}
      </p>
    </div>
  );
}

export function TrendChart({
  range,
  onRangeChange,
}: {
  range: Range;
  onRangeChange: (r: Range) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const data = useMemo(() => volumeSeries(range), [range]);

  const totals = useMemo(() => {
    const sum = (k: "leads" | "enriched" | "replies" | "meetings") =>
      data.reduce((n, d) => n + d[k], 0);
    const leads = sum("leads");
    const replies = sum("replies");
    return {
      leads,
      replies,
      meetings: sum("meetings"),
      replyRate: leads > 0 ? Math.round((replies / leads) * 100) : 0,
      leadsDelta: halfDelta(data.map((d) => d.leads)),
      repliesDelta: halfDelta(data.map((d) => d.replies)),
    };
  }, [data]);

  return (
    <ChartCard
      className="h-full"
      title="Volume de prospection"
      subtitle="Prospects détectés, enrichis et réponses obtenues"
      actions={<RangeToggle value={range} onChange={(v) => onRangeChange(v as Range)} />}
      footer={
        <ChartLegend
          items={[
            { label: "Prospects", color: CHART_COLORS[0] },
            { label: "Enrichis", color: CHART_COLORS[2] },
            { label: "Réponses", color: CHART_COLORS[1] },
          ]}
        />
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Prospects"
          value={totals.leads.toLocaleString("fr-FR")}
          delta={totals.leadsDelta}
        />
        <Stat
          label="Réponses"
          value={totals.replies.toLocaleString("fr-FR")}
          delta={totals.repliesDelta}
        />
        <Stat label="Taux de réponse" value={`${totals.replyRate}\u00a0%`} />
        <Stat label="Rendez-vous" value={totals.meetings.toLocaleString("fr-FR")} />
      </div>

      <ScrollFrame
        minWidth={Math.max(560, data.length * 72)}
        label="Volume de prospection, défilement horizontal"
      >
        <ClientChart height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id={`trend-leads-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.34} />
                <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`trend-enriched-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_STYLE} dy={6} />
            <YAxis tickLine={false} axisLine={false} width={44} tick={AXIS_STYLE} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_COLOR, strokeWidth: 1.5 }} />
            <Area
              type="monotone"
              name="Prospects"
              dataKey="leads"
              stroke={CHART_COLORS[0]}
              strokeWidth={2.5}
              fill={`url(#trend-leads-${uid})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--background)" }}
            />
            <Area
              type="monotone"
              name="Enrichis"
              dataKey="enriched"
              stroke={CHART_COLORS[2]}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              fill={`url(#trend-enriched-${uid})`}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: "var(--background)" }}
            />
            <Line
              type="monotone"
              name="Réponses"
              dataKey="replies"
              stroke={CHART_COLORS[1]}
              strokeWidth={2.5}
              dot={{ r: 2.5, strokeWidth: 0, fill: CHART_COLORS[1] }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
            />
          </ComposedChart>
        </ClientChart>
      </ScrollFrame>
    </ChartCard>
  );
}

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const last = steps[steps.length - 1];
  const overall = steps[0]?.count ? Math.round((last.count / steps[0].count) * 100) : 0;

  return (
    <ChartCard
      className="h-full"
      title="Entonnoir de conversion"
      subtitle="Du premier contact à la signature"
      footer={
        <p className="text-xs text-muted-foreground">
          Conversion globale :{" "}
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {overall}&nbsp;%
          </span>
        </p>
      }
    >
      <ScrollFrame
        fit="content"
        minWidth={420}
        label="Entonnoir de conversion, défilement horizontal"
      >
        <ol className="flex flex-col">
          {steps.map((s, i) => (
            <li key={s.key}>
              {s.conversion !== null && (
                <div className="grid grid-cols-[116px_1fr_auto] items-center gap-3 py-1">
                  <span />
                  <span className="flex items-center gap-1 whitespace-nowrap pl-1 text-[11px] text-muted-foreground">
                    <ChevronDown className="size-3 shrink-0" />
                    <span className="font-mono tabular-nums">{s.conversion}&nbsp;%</span> passent à
                    l'étape suivante
                  </span>
                  <span className="w-12" />
                </div>
              )}
              <div className="grid grid-cols-[116px_1fr_auto] items-center gap-3">
                <span className="whitespace-nowrap text-xs text-muted-foreground md:text-[13px]">
                  {s.label}
                </span>
                <div className="h-8 overflow-hidden rounded-lg bg-secondary/60">
                  <div
                    className="h-full rounded-lg transition-[width] duration-700"
                    style={{
                      width: `${Math.max(s.share, s.count > 0 ? 4 : 0)}%`,
                      background: `linear-gradient(90deg, color-mix(in oklab, ${CHART_COLORS[i % CHART_COLORS.length]} 70%, transparent), ${CHART_COLORS[i % CHART_COLORS.length]})`,
                    }}
                  />
                </div>
                <span className="w-12 whitespace-nowrap text-right font-mono text-xs font-semibold tabular-nums md:text-[13px]">
                  {s.count.toLocaleString("fr-FR")}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </ScrollFrame>
    </ChartCard>
  );
}

export type PipelineStage = {
  stage: keyof typeof STAGE_LABELS;
  label: string;
  count: number;
  amount: number;
};

export function PipelineDonut({ stages }: { stages: PipelineStage[] }) {
  const open = stages.filter((s) => s.stage !== "won" && s.stage !== "lost");
  const openTotal = open.reduce((n, s) => n + s.amount, 0);
  const all = stages.reduce((n, s) => n + s.amount, 0) || 1;

  return (
    <ChartCard
      className="h-full"
      title="Pipeline par étape"
      subtitle={`${open.reduce((n, s) => n + s.count, 0)} opportunités ouvertes`}
      footer={
        <ScrollFrame
          fit="content"
          minWidth={280}
          label="Légende du pipeline, défilement horizontal"
        >
          <ul className="space-y-2.5">
            {stages.map((s, i) => (
              <li
                key={s.stage}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1"
              >
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor:
                      s.stage === "lost"
                        ? "var(--muted-foreground)"
                        : CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {s.label} · {s.count}
                </span>
                <span className="whitespace-nowrap pl-4 text-right font-mono text-xs tabular-nums">
                  {formatCompactEuroFr(s.amount)}
                </span>
                <span />
                <div className="col-span-2 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((s.amount / all) * 100)}%`,
                      backgroundColor:
                        s.stage === "lost"
                          ? "var(--muted-foreground)"
                          : CHART_COLORS[i % CHART_COLORS.length],
                      opacity: s.stage === "lost" ? 0.4 : 1,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ScrollFrame>
      }
    >
      <ScrollFrame minWidth={260} label="Répartition du pipeline, défilement horizontal">
        <div className="relative">
          <ClientChart height={240}>
            <PieChart>
              <Tooltip
                content={
                  <ChartTooltip formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`} />
                }
              />
              <Pie
                data={open}
                dataKey="amount"
                nameKey="label"
                innerRadius="66%"
                outerRadius="92%"
                paddingAngle={3}
                cornerRadius={6}
                startAngle={90}
                endAngle={-270}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {open.map((s) => (
                  <Cell
                    key={s.stage}
                    fill={CHART_COLORS[stages.indexOf(s) % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ClientChart>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="font-display text-3xl leading-none tabular-nums">
                {formatCompactEuroFr(openTotal)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                en cours
              </p>
            </div>
          </div>
        </div>
      </ScrollFrame>
    </ChartCard>
  );
}

export function ScoreHistogram({
  buckets,
  unscored,
}: {
  buckets: ScoreBucket[];
  unscored: number;
}) {
  const hot = buckets.filter((b) => b.hot).reduce((n, b) => n + b.value, 0);
  return (
    <ChartCard
      className="h-full"
      title="Qualité des prospects"
      subtitle="Répartition par score"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            <span className="font-mono font-semibold tabular-nums text-foreground">{hot}</span> avec
            un score de 8 ou plus
          </span>
          {unscored > 0 && <span>{unscored} sans score</span>}
        </div>
      }
    >
      <ScrollFrame minWidth={340} label="Qualité des prospects, défilement horizontal">
        <ClientChart height={220}>
          <BarChart data={buckets} margin={{ top: 16, right: 4, left: -26, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_STYLE} dy={6} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={AXIS_STYLE} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
            <Bar name="Prospects" dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={34}>
              {buckets.map((b) => (
                <Cell
                  key={b.label}
                  fill={
                    b.hot
                      ? CHART_COLORS[0]
                      : "color-mix(in oklab, var(--muted-foreground) 40%, transparent)"
                  }
                />
              ))}
              <LabelList dataKey="value" position="top" style={{ ...AXIS_STYLE, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ClientChart>
      </ScrollFrame>
    </ChartCard>
  );
}

export function WorkflowRunsChart({
  series,
  successRate,
  total,
}: {
  series: { day: string; success: number; failed: number }[];
  successRate: number;
  total: number;
}) {
  return (
    <ChartCard
      className="h-full"
      title="Exécutions des automatisations"
      subtitle={`${total.toLocaleString("fr-FR")} exécutions sur 7 jours`}
      actions={
        <span className="whitespace-nowrap rounded-full bg-success/12 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-success md:text-xs">
          {successRate}&nbsp;% de réussite
        </span>
      }
      footer={
        <ChartLegend
          items={[
            { label: "Réussies", color: CHART_COLORS[2] },
            { label: "En erreur", color: "var(--destructive)" },
          ]}
        />
      }
    >
      <ScrollFrame minWidth={460} label="Exécutions des automatisations, défilement horizontal">
        <ClientChart height={240}>
          <BarChart data={series} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS_STYLE} dy={6} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={AXIS_STYLE} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
            <Bar
              name="Réussies"
              dataKey="success"
              stackId="r"
              fill={CHART_COLORS[2]}
              maxBarSize={36}
            />
            <Bar
              name="En erreur"
              dataKey="failed"
              stackId="r"
              fill="var(--destructive)"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ClientChart>
      </ScrollFrame>
    </ChartCard>
  );
}

export function ChannelChart({ channels }: { channels: { channel: string; value: number }[] }) {
  const height = Math.max(180, channels.length * 44);
  return (
    <ChartCard
      className="h-full"
      title="Canaux d'activité"
      subtitle="Volume d'interactions par canal"
    >
      <ScrollFrame minWidth={340} label="Canaux d'activité, défilement horizontal">
        <ClientChart height={height}>
          <BarChart
            data={channels}
            layout="vertical"
            margin={{ top: 0, right: 28, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="channel"
              tickLine={false}
              axisLine={false}
              width={92}
              tick={AXIS_STYLE}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
            <Bar name="Interactions" dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
              {channels.map((c, i) => (
                <Cell key={c.channel} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
              <LabelList dataKey="value" position="right" style={{ ...AXIS_STYLE, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ClientChart>
      </ScrollFrame>
    </ChartCard>
  );
}
