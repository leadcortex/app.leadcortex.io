//frontend\routes\app.analytics.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsSkeleton } from "@/components/skeletons";
import {
  CHART_COLORS,
  ChartCard,
  ChartLegend,
  ChartTooltip,
  ClientChart,
  GRID_COLOR,
  RangeToggle,
  ScrollFrame,
} from "@/components/charts";
import { useAppStore } from "@/lib/store";
import {
  buyingSignals,
  channelMix,
  emailOutcomes,
  funnelSteps,
  resolveSource,
  visitorIntent,
  volumeSeries,
  workflowRunsSeries,
} from "@/lib/dashboard-metrics";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analyses — LeadCortex" },
      {
        name: "description",
        content:
          "Analyses LeadCortex : entonnoir de conversion, performance des canaux, signaux d'achat et rendement des automatisations.",
      },
      { property: "og:title", content: "Analyses — LeadCortex" },
      {
        property: "og:description",
        content: "Entonnoir, canaux, signaux et automatisations : ce qui convertit vraiment.",
      },
    ],
  }),
  pendingComponent: () => <AnalyticsSkeleton />,
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const store = useAppStore();
  const [range, setRange] = useState<"7j" | "30j" | "90j">("30j");

  const src = useMemo(
    () =>
      resolveSource({
        leads: store.leads,
        tasks: store.tasks,
        deals: store.deals,
        emails: store.emails,
        meetings: store.meetings,
        workflows: store.workflows,
        conversations: store.conversations,
        calls: store.calls,
        visitors: store.visitors,
        sequences: store.sequences as never,
      }),
    [
      store.leads,
      store.tasks,
      store.deals,
      store.emails,
      store.meetings,
      store.workflows,
      store.conversations,
      store.calls,
      store.visitors,
      store.sequences,
    ],
  );

  const volume = useMemo(() => volumeSeries(range), [range]);
  const funnel = useMemo(() => funnelSteps(src), [src]);
  const channels = useMemo(() => channelMix(src), [src]);
  const outcomes = useMemo(() => emailOutcomes(src.emails), [src.emails]);
  const intents = useMemo(() => visitorIntent(src.visitors), [src.visitors]);
  const automation = useMemo(() => workflowRunsSeries(src.workflows), [src.workflows]);

  const totalLeads = volume.reduce((n, d) => n + d.leads, 0);
  const totalReplies = volume.reduce((n, d) => n + d.replies, 0);
  const totalMeetings = volume.reduce((n, d) => n + d.meetings, 0);
  const replyRate = totalLeads ? (totalReplies / totalLeads) * 100 : 0;

  const conversion = useMemo(() => {
    const base = funnel[0]?.value || 1;
    return funnel.map((f) => ({ step: f.step, rate: Math.round((f.value / base) * 1000) / 10 }));
  }, [funnel]);

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <header className="mb-6 animate-fade-in-up md:mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground md:text-xs">
          Analyses
        </p>
        <h1 className="mt-1 font-display text-2xl italic md:text-5xl">Ce qui convertit.</h1>
        <p className="mt-1 text-xs text-muted-foreground md:mt-2 md:text-sm">
          Entonnoir, canaux, signaux et rendement des automatisations — regardez avant de scaler.
        </p>
      </header>

      {}
      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
        <MetricTile
          label="Leads analysés"
          value={totalLeads.toLocaleString("fr-FR")}
          delta="+18%"
          up
        />
        <MetricTile label="Réponses" value={totalReplies.toLocaleString("fr-FR")} delta="+9%" up />
        <MetricTile label="Taux de réponse" value={`${replyRate.toFixed(1)}%`} delta="-1,2 pt" />
        <MetricTile label="RDV obtenus" value={String(totalMeetings)} delta="+14%" up />
      </div>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Évolution du volume"
          subtitle="Leads, enrichissements et réponses"
          actions={<RangeToggle value={range} onChange={(v) => setRange(v as "7j")} />}
          footer={
            <ChartLegend
              items={[
                { label: "Leads", color: CHART_COLORS[0] },
                { label: "Enrichis", color: CHART_COLORS[1] },
                { label: "Réponses", color: CHART_COLORS[2] },
              ]}
            />
          }
        >
          <ScrollFrame minWidth={580}>
            <ClientChart height={300}>
              <AreaChart data={volume} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  {[0, 1, 2].map((i) => (
                    <linearGradient key={i} id={`anaArea${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={CHART_COLORS[i]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_COLOR }} />
                <Area
                  type="monotone"
                  name="Leads"
                  dataKey="leads"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  fill="url(#anaArea0)"
                />
                <Area
                  type="monotone"
                  name="Enrichis"
                  dataKey="enriched"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  fill="url(#anaArea1)"
                />
                <Area
                  type="monotone"
                  name="Réponses"
                  dataKey="replies"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  fill="url(#anaArea2)"
                />
              </AreaChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>

        <ChartCard
          title="Entonnoir de conversion"
          subtitle="Du lead détecté à l'affaire signée"
          footer={
            <p className="text-[11px] text-muted-foreground md:text-xs">
              Conversion globale{" "}
              <span className="font-mono text-foreground">
                {conversion[conversion.length - 1]?.rate ?? 0}%
              </span>
            </p>
          }
        >
          <ScrollFrame minWidth={320}>
            <ClientChart height={300}>
              <BarChart
                data={funnel}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="step"
                  tickLine={false}
                  axisLine={false}
                  width={78}
                  fontSize={11}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar name="Volume" dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
                  {funnel.map((f, i) => (
                    <Cell key={f.step} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Taux de passage par étape"
          subtitle="Part des leads initiaux encore présents à chaque étape"
        >
          <ScrollFrame minWidth={520}>
            <ClientChart height={260}>
              <LineChart data={conversion} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="step" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  fontSize={11}
                  unit="%"
                  domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
                <Line
                  type="monotone"
                  name="Taux de passage"
                  dataKey="rate"
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>

        <ChartCard title="Mix des canaux" subtitle="Volume d'interactions par canal">
          <ClientChart height={260}>
            <RadarChart data={channels} outerRadius="72%">
              <PolarGrid stroke={GRID_COLOR} />
              <PolarAngleAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Radar
                name="Interactions"
                dataKey="value"
                stroke={CHART_COLORS[0]}
                fill={CHART_COLORS[0]}
                fillOpacity={0.28}
              />
            </RadarChart>
          </ClientChart>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-3">
        <ChartCard title="Résultats des envois" subtitle="Répartition des statuts d'emails">
          <ScrollFrame minWidth={300}>
            <ClientChart height={240}>
              <BarChart
                data={outcomes}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  fontSize={11}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar name="Emails" dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {outcomes.map((o, i) => (
                    <Cell key={o.label} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>

        <ChartCard
          title="Intention des visiteurs"
          subtitle="Comptes identifiés sur le site"
          footer={
            <ChartLegend
              items={intents.map((it, i) => ({
                label: it.label,
                color: CHART_COLORS[i % CHART_COLORS.length],
              }))}
            />
          }
        >
          <ClientChart height={240}>
            <PieChart>
              <Tooltip content={<ChartTooltip />} />
              <Pie
                data={intents}
                dataKey="value"
                nameKey="label"
                innerRadius="56%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {intents.map((it, i) => (
                  <Cell key={it.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ClientChart>
        </ChartCard>

        <ChartCard
          title="Rendement des automatisations"
          subtitle="Exécutions réussies vs en erreur"
          footer={
            <ChartLegend
              items={[
                { label: "Réussies", color: CHART_COLORS[2] },
                { label: "En erreur", color: "var(--destructive)" },
              ]}
            />
          }
        >
          <ScrollFrame minWidth={340}>
            <ClientChart height={240}>
              <BarChart data={automation} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar
                  name="Réussies"
                  dataKey="success"
                  stackId="a"
                  fill={CHART_COLORS[2]}
                  maxBarSize={30}
                />
                <Bar
                  name="En erreur"
                  dataKey="failed"
                  stackId="a"
                  fill="var(--destructive)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>
      </div>

      <ChartCard
        className="mt-4 md:mt-6"
        title="Signaux d'achat détectés"
        subtitle="Part des signaux à l'origine des réponses positives"
      >
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {buyingSignals.map((s, i) => (
            <li key={s.label} className="min-w-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="truncate text-xs md:text-sm">{s.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums">{s.value}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.value * 2}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}

function MetricTile({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
}) {
  return (
    <div className="kpi-card rounded-2xl border border-border bg-background p-3 md:p-5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground md:text-[11px]">
        {label}
      </p>
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 md:mt-2">
        <p className="truncate font-display text-xl md:text-4xl">{value}</p>
        {delta && (
          <span
            className={`shrink-0 text-[10px] md:text-xs ${up ? "text-primary" : "text-muted-foreground"}`}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
