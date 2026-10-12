//frontend\routes\app.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";

import { Badge, PageHeader } from "@/components/ui-primitives";
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
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { EmptyDashboard } from "@/components/onboarding/empty-dashboard";
import { WelcomeSkeleton } from "@/components/skeletons";
import {
  formatCompactEuro,
  formatEuro,
  pipelineByStage,
  resolveSource,
  topWorkflows,
  volumeSeries,
  workflowRunsSeries,
  workflowStatusBreakdown,
} from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LeadCortex" },
      {
        name: "description",
        content:
          "Vue d'ensemble LeadCortex : pipeline, automatisations, exécutions de workflows et priorités du jour.",
      },
      { property: "og:title", content: "Dashboard — LeadCortex" },
      {
        property: "og:description",
        content: "Pipeline, workflows et priorités du jour, réunis dans un seul tableau de bord.",
      },
    ],
  }),
  pendingComponent: () => <WelcomeSkeleton />,
  component: DashboardRoute,
});

function DashboardRoute() {
  const store = useAppStore();

  const snapshot = useMemo(
    () =>
      getOnboardingSnapshot({
        leads: store.leads,
        companies: store.companies,
        sequences: store.sequences,
        workflows: store.workflows,
        deals: store.deals,
      }),
    [store.leads, store.companies, store.sequences, store.workflows, store.deals],
  );

  if (!store.hydrated) return <WelcomeSkeleton />;

  if (snapshot.level === "empty") return <EmptyDashboard />;

  return <DashboardPage />;
}

function DashboardPage() {
  const store = useAppStore();
  const { toggleTask, activity, user, hydrated } = store;
  const [range, setRange] = useState<"7j" | "30j" | "90j">("7j");

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

  const openDeals = src.deals.filter((d) => d.stage !== "lost");
  const pipelineTotal = openDeals.reduce((n, d) => n + d.amount, 0);
  const wonTotal = src.deals.filter((d) => d.stage === "won").reduce((n, d) => n + d.amount, 0);
  const activeWorkflows = src.workflows.filter((w) => w.status === "active");
  const totalRuns = src.workflows.reduce((n, w) => n + w.runs, 0);
  const automatedActions = src.workflows.reduce((n, w) => n + w.actions * w.runs, 0);
  const openTasks = src.tasks.filter((t) => !t.done);

  const volume = useMemo(() => volumeSeries(range), [range]);
  const runs = useMemo(() => workflowRunsSeries(src.workflows), [src.workflows]);
  const stages = useMemo(() => pipelineByStage(src.deals), [src.deals]);
  const statuses = useMemo(() => workflowStatusBreakdown(src.workflows), [src.workflows]);
  const leaders = useMemo(() => topWorkflows(src.workflows), [src.workflows]);

  if (!hydrated) return <WelcomeSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={`Bonjour, ${user.name ?? "Utilisateur"}.`}
        description="Pipeline, automatisations et priorités — tout ce que Cortex a préparé pour vous."
        actions={
          <>
            <a
              href="/app/workflows"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-surface"
            >
              <WorkflowIcon className="size-3.5" /> Workflows
            </a>
            <a
              href="/app/people"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              <Sparkles className="size-3.5" /> Prospecter
            </a>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
        <DashboardKpi
          label="Leads"
          value={String(src.leads.length)}
          delta="+18%"
          up
          sub="cette semaine"
        />
        <DashboardKpi
          label="Pipeline ouvert"
          value={formatCompactEuro(pipelineTotal)}
          delta="+12%"
          up
          sub={`${openDeals.length} opportunités`}
        />
        <DashboardKpi
          label="Signé"
          value={formatCompactEuro(wonTotal)}
          delta="+7%"
          up
          sub="30 derniers jours"
        />
        <DashboardKpi
          label="Workflows actifs"
          value={String(activeWorkflows.length)}
          sub={`${src.workflows.length} au total`}
        />
        <DashboardKpi
          label="Exécutions"
          value={totalRuns.toLocaleString("fr-FR")}
          delta="+24%"
          up
          sub="automatisations"
        />
        <DashboardKpi
          label="Actions automatisées"
          value={`${Math.round(automatedActions / 1000)}K`}
          sub="temps gagné ≈ 42 h"
        />
      </div>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Volume de prospection"
          subtitle="Leads détectés, enrichis et réponses obtenues"
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
          <ScrollFrame minWidth={560}>
            <ClientChart height={280}>
              <AreaChart data={volume} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  {[0, 1, 2].map((i) => (
                    <linearGradient key={i} id={`dashArea${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={0.35} />
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
                  fill="url(#dashArea0)"
                />
                <Area
                  type="monotone"
                  name="Enrichis"
                  dataKey="enriched"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  fill="url(#dashArea1)"
                />
                <Area
                  type="monotone"
                  name="Réponses"
                  dataKey="replies"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  fill="url(#dashArea2)"
                />
              </AreaChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>

        <ChartCard
          title="Pipeline par étape"
          subtitle={`${formatEuro(pipelineTotal)} en cours`}
          footer={
            <ul className="space-y-1.5">
              {stages.map((s, i) => (
                <li key={s.stage} className="flex items-center gap-2 text-[11px] md:text-xs">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="min-w-0 truncate text-muted-foreground">{s.label}</span>
                  <span className="ml-auto shrink-0 font-mono tabular-nums">
                    {formatCompactEuro(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          }
        >
          <ClientChart height={240}>
            <PieChart>
              <Tooltip
                content={
                  <ChartTooltip formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`} />
                }
              />
              <Pie
                data={stages}
                dataKey="amount"
                nameKey="label"
                innerRadius="58%"
                outerRadius="86%"
                paddingAngle={2}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {stages.map((s, i) => (
                  <Cell key={s.stage} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ClientChart>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Exécutions de workflows"
          subtitle="Réussies vs en erreur sur les 7 derniers jours"
          actions={
            <a
              href="/app/workflows"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground md:text-xs"
            >
              Ouvrir <ArrowUpRight className="size-3" />
            </a>
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
          <ScrollFrame minWidth={520}>
            <ClientChart height={250}>
              <BarChart data={runs} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar
                  name="Réussies"
                  dataKey="success"
                  stackId="r"
                  fill={CHART_COLORS[2]}
                  maxBarSize={38}
                />
                <Bar
                  name="En erreur"
                  dataKey="failed"
                  stackId="r"
                  fill="var(--destructive)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            </ClientChart>
          </ScrollFrame>
        </ChartCard>

        <ChartCard
          title="Santé des automatisations"
          subtitle={`${activeWorkflows.length} workflows en production`}
          footer={
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground md:text-xs">
              <Zap className="size-3.5 text-primary" />
              Taux de réussite global 96,5 %
            </div>
          }
        >
          <ClientChart height={240}>
            <PieChart>
              <Tooltip content={<ChartTooltip />} />
              <Pie
                data={statuses}
                dataKey="value"
                nameKey="label"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {statuses.map((s, i) => (
                  <Cell key={s.label} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ClientChart>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-3">
        <section className="min-w-0 rounded-2xl border border-border bg-background p-4 md:p-6">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-sm font-semibold md:text-base">Top automatisations</h2>
            <a
              href="/app/workflows"
              className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground md:text-xs"
            >
              Voir tout →
            </a>
          </div>
          <ul className="space-y-3">
            {leaders.map((w) => {
              const max = leaders[0]?.runs || 1;
              return (
                <li key={w.id} className="min-w-0">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <p className="truncate text-xs md:text-sm">{w.name}</p>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {w.runs}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((w.runs / max) * 100)}%`,
                        backgroundColor:
                          w.status === "active" ? CHART_COLORS[0] : "var(--muted-foreground)",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border border-border bg-background p-4 md:p-6">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-sm font-semibold md:text-base">
              Priorités du jour
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                {openTasks.length}
              </span>
            </h2>
            <a
              href="/app/tasks"
              className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground md:text-xs"
            >
              Voir tout →
            </a>
          </div>
          <ul className="space-y-1">
            {src.tasks.slice(0, 6).map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface/60"
              >
                <button type="button" onClick={() => toggleTask(t.id)} className="shrink-0">
                  {t.done ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground hover:text-primary" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-xs md:text-sm",
                      t.done && "text-muted-foreground line-through",
                    )}
                  >
                    {t.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {t.contact} · {t.due}
                  </p>
                </div>
                <Badge tone={t.priority === "high" ? "primary" : "muted"}>{t.priority}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background p-4 md:p-6">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-sm font-semibold md:text-base">Prochains rendez-vous</h2>
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <ul className="space-y-2">
            {src.meetings.slice(0, 5).map((m) => (
              <li
                key={m.id}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-lg px-2 py-1.5 transition-colors hover:bg-surface/60"
              >
                <div className="flex w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg bg-surface px-1.5 py-1.5 text-center">
                  <p className="w-full truncate text-[10px] uppercase leading-tight text-muted-foreground">
                    {m.date}
                  </p>
                  <p className="mt-0.5 w-full truncate font-mono text-xs leading-tight">{m.time}</p>
                </div>
                <div className="min-w-0 overflow-hidden border-l border-border pl-3">
                  <p className="truncate text-xs font-medium md:text-sm">{m.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {m.with} · {m.company}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-background p-4 md:mt-6 md:p-6">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-sm font-semibold md:text-base">Opportunités récentes</h2>
          <a
            href="/app/deals"
            className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground md:text-xs"
          >
            Ouvrir le pipeline →
          </a>
        </div>
        <div className="overflow-x-auto overscroll-x-contain scrollbar-hide">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="border-b border-border px-3 py-2 font-medium">Opportunité</th>
                <th className="border-b border-border px-3 py-2 font-medium">Contact</th>
                <th className="border-b border-border px-3 py-2 font-medium">Étape</th>
                <th className="border-b border-border px-3 py-2 text-right font-medium">Proba.</th>
                <th className="border-b border-border px-3 py-2 text-right font-medium">Montant</th>
                <th className="border-b border-border px-3 py-2 text-right font-medium">Clôture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {src.deals.slice(0, 6).map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-surface/50">
                  <td className="px-3 py-3">
                    <p className="text-xs font-medium md:text-sm">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.company}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground md:text-sm">
                    {d.contact}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      tone={
                        d.stage === "won"
                          ? "success"
                          : d.stage === "negotiation"
                            ? "primary"
                            : d.stage === "lost"
                              ? "destructive"
                              : "muted"
                      }
                    >
                      {d.stage}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs tabular-nums">
                    {d.probability}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs tabular-nums md:text-sm">
                    {d.amount.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-3 py-3 text-right text-[11px] text-muted-foreground">
                    {d.close}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  KPI local (identique à celui d'origine)                                   */
/* -------------------------------------------------------------------------- */

function DashboardKpi({
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
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-background p-3 md:p-4">
      <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-xs">
        {label}
      </p>
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="truncate font-display text-xl leading-none tabular-nums md:text-2xl">
          {value}
        </p>
        {delta && (
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums md:text-[11px]",
              up
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="truncate text-[10px] text-muted-foreground md:text-xs">{sub}</p>}
    </div>
  );
}
