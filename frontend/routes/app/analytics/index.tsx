// frontend/routes/app/analytics/index.tsx

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
  ChartLegend,
  ChartTooltip,
  ClientChart,
  GRID_COLOR,
  RangeToggle,
  ScrollFrame,
} from "@/components/charts/charts";
import { useAppStore } from "@/lib/state/store";
import {
  buyingSignals,
  channelMix,
  emailOutcomes,
  funnelSteps,
  resolveSource,
  visitorIntent,
  volumeSeries,
  workflowRunsSeries,
} from "@/lib/analytics/dashboard-metrics";
import { ProgressCapsule } from "@/components/ui/capsule-progress";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { PageHeader } from "@/components/common/ui-primitives";
import { DashSection } from "@/components/dashboard/dashboard-section";

export const Route = createFileRoute("/app/analytics/")({
  head: () => ({
    meta: [
      { title: "Analyses · LeadCortex" },
      {
        name: "description",
        content:
          "Analyses LeadCortex : entonnoir de conversion, performance des canaux, signaux d'achat et rendement des automatisations.",
      },
      { property: "og:title", content: "Analyses · LeadCortex" },
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
  const [showMore, setShowMore] = useState(false);

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
  const replyRate = totalLeads ? (totalReplies / totalLeads) * 100 : 0;

  const conversion = useMemo(() => {
    const base = funnel[0]?.value || 1;
    return funnel.map((f) => ({ step: f.step, rate: Math.round((f.value / base) * 1000) / 10 }));
  }, [funnel]);

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-12">
      <PageHeader
        eyebrow="Analyses"
        title="Ce qui convertit."
        description={`${totalLeads.toLocaleString("fr-FR")} prospects sur ${range.replace("j", " jours")} · ${replyRate.toFixed(1).replace(".", ",")} % de réponse`}
      />

      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr] xl:gap-12">
        <DashSection
          title="Évolution du volume"
          subtitle="Prospects, enrichissements et réponses"
          actions={<RangeToggle value={range} onChange={(v) => setRange(v as "7j")} />}
          footer={
            <ChartLegend
              items={[
                { label: "Prospects", color: CHART_COLORS[0] },
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
                      <stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={0.14} />
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
                  name="Prospects"
                  dataKey="leads"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2.5}
                  fill="url(#anaArea0)"
                />
                <Area
                  type="monotone"
                  name="Enrichis"
                  dataKey="enriched"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2.5}
                  fill="url(#anaArea1)"
                />
                <Area
                  type="monotone"
                  name="Réponses"
                  dataKey="replies"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2.5}
                  fill="url(#anaArea2)"
                />
              </AreaChart>
            </ClientChart>
          </ScrollFrame>
        </DashSection>

        <DashSection
          title="Entonnoir de conversion"
          subtitle={`Du prospect détecté à l'affaire signée · ${conversion[conversion.length - 1]?.rate ?? 0} % au total`}
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
        </DashSection>
      </div>

      <div className="mt-12 grid gap-8 xl:grid-cols-3 xl:gap-12">
        <DashSection title="Résultats des envois" subtitle="Répartition des statuts d'emails">
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
        </DashSection>

        <DashSection
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
        </DashSection>

        <DashSection
          title="Rendement des automatisations"
          subtitle="Exécutions réussies et en erreur"
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
        </DashSection>
      </div>

      <DashSection
        className="mt-12"
        title="Signaux d'achat"
        subtitle="Part des signaux à l'origine des réponses positives"
      >
        <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-5">
          {buyingSignals.map((s, i) => (
            <li key={s.label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px]">{s.label}</span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums">
                  {s.value}&nbsp;%
                </span>
              </div>
              <div className="mt-2">
                <ProgressCapsule
                  value={s.value}
                  max={50}
                  size="sm"
                  fillVar={CHART_COLORS[i % CHART_COLORS.length]}
                />
              </div>
            </li>
          ))}
        </ul>
      </DashSection>

      <div className="mt-12 border-t border-border/60 pt-6">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {showMore ? "Moins de détails" : "Plus de détails"}
          <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} />
        </button>
        {showMore && (
          <div className="mt-8">
          <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr] xl:gap-12">
            <DashSection
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
            </DashSection>

            <DashSection title="Mix des canaux" subtitle="Volume d'interactions par canal">
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
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ClientChart>
            </DashSection>
          </div>

          </div>
        )}
      </div>
    </div>
  );
}
