// frontend/routes/app/index.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Workflow as WorkflowIcon,
} from "@/components/icons";

import { PageHeader } from "@/components/common/ui-primitives";
import { KnownPeopleExplorer } from "@/components/discovery/known-people";
import { EmptyDashboard } from "@/components/onboarding/empty-dashboard";
import { WelcomeSkeleton } from "@/components/skeletons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KpiStrip } from "@/components/dashboard/dashboard-kpis";
import {
  ChannelChart,
  FunnelChart,
  PipelineDonut,
  ScoreHistogram,
  TrendChart,
  WorkflowRunsChart,
  type Range,
} from "@/components/dashboard/dashboard-charts";
import {
  DealsWidget,
  InsightsWidget,
  MeetingsWidget,
  PrioritiesWidget,
  SignalsWidget,
  TasksWidget,
} from "@/components/dashboard/dashboard-widgets";
import { useAppStore } from "@/lib/state/store";
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { useCurrentUser } from "@/hooks/use-current-user";
import { pipelineByStage, resolveSource } from "@/lib/analytics/dashboard-metrics";
import {
  buildChannels,
  buildFunnel,
  buildInsights,
  buildKpis,
  buildScoreBuckets,
  workflowHealth,
} from "@/lib/analytics/dashboard-insights";
import { getHotSignals, getTopPriorityLeads } from "@/lib/analytics/dashboard-metrics-people";
import {
  readPeoplePreferences,
  syncAutoHideKnownPeople,
  writePeoplePreferences,
} from "@/lib/people/preferences";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LeadCortex" },
      {
        name: "description",
        content:
          "Vue d'ensemble LeadCortex : pipeline, automatisations, priorités du jour et prospects.",
      },
      { property: "og:title", content: "Dashboard — LeadCortex" },
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

type DashData = {
  range: Range;
  setRange: (r: Range) => void;
  src: ReturnType<typeof resolveSource>;
  stages: ReturnType<typeof pipelineByStage>;
  funnel: ReturnType<typeof buildFunnel>;
  scores: ReturnType<typeof buildScoreBuckets>;
  channels: ReturnType<typeof buildChannels>;
  health: ReturnType<typeof workflowHealth>;
  insights: ReturnType<typeof buildInsights>;
  priorities: ReturnType<typeof getTopPriorityLeads>;
  signals: ReturnType<typeof getHotSignals>;
  toggleTask: (id: string) => void;
};

type WidgetSize = 5 | 6 | 7 | 12;

type WidgetDef = {
  id: string;
  label: string;
  size: WidgetSize;
  visible: (d: DashData) => boolean;
  render: (d: DashData) => ReactNode;
};

const WIDGETS: WidgetDef[] = [
  {
    id: "trend",
    label: "Volume de prospection",
    size: 7,
    visible: () => true,
    render: (d) => <TrendChart range={d.range} onRangeChange={d.setRange} />,
  },
  {
    id: "insights",
    label: "À traiter maintenant",
    size: 5,
    visible: (d) => d.insights.length > 0,
    render: (d) => <InsightsWidget insights={d.insights} />,
  },
  {
    id: "funnel",
    label: "Entonnoir de conversion",
    size: 7,
    visible: (d) => d.funnel[0]?.count > 0,
    render: (d) => <FunnelChart steps={d.funnel} />,
  },
  {
    id: "pipeline",
    label: "Pipeline par étape",
    size: 5,
    visible: (d) => d.stages.length > 0,
    render: (d) => <PipelineDonut stages={d.stages} />,
  },
  {
    id: "workflows",
    label: "Exécutions des automatisations",
    size: 7,
    visible: (d) => d.health.total > 0,
    render: (d) => (
      <WorkflowRunsChart
        series={d.health.series}
        successRate={d.health.successRate}
        total={d.health.total}
      />
    ),
  },
  {
    id: "scores",
    label: "Qualité des prospects",
    size: 5,
    visible: (d) => d.scores.buckets.some((b) => b.value > 0),
    render: (d) => <ScoreHistogram buckets={d.scores.buckets} unscored={d.scores.unscored} />,
  },
  {
    id: "channels",
    label: "Canaux d'activité",
    size: 5,
    visible: (d) => d.channels.length > 0,
    render: (d) => <ChannelChart channels={d.channels} />,
  },
  {
    id: "priorities",
    label: "Prospects prioritaires",
    size: 7,
    visible: () => true,
    render: (d) => <PrioritiesWidget leads={d.priorities} />,
  },
  {
    id: "signals",
    label: "Signaux chauds",
    size: 5,
    visible: (d) => d.signals.length > 0,
    render: (d) => <SignalsWidget groups={d.signals} />,
  },
  {
    id: "meetings",
    label: "Prochains rendez-vous",
    size: 7,
    visible: (d) => d.src.meetings.length > 0,
    render: (d) => <MeetingsWidget meetings={d.src.meetings} />,
  },
  {
    id: "deals",
    label: "Opportunités récentes",
    size: 7,
    visible: (d) => d.src.deals.length > 0,
    render: (d) => <DealsWidget deals={d.src.deals} />,
  },
  {
    id: "tasks",
    label: "Tâches",
    size: 5,
    visible: (d) => d.src.tasks.length > 0,
    render: (d) => <TasksWidget tasks={d.src.tasks} onToggle={d.toggleTask} />,
  },
];

const DEFAULT_ORDER = WIDGETS.map((w) => w.id);

const LEGACY_DEFAULT_ORDER = [
  "trend",
  "insights",
  "funnel",
  "pipeline",
  "scores",
  "priorities",
  "signals",
  "meetings",
  "workflows",
  "channels",
  "deals",
  "tasks",
];

const LAYOUT_KEY = "leadcortex.dashboard.layout.v1";

type LayoutPrefs = { order: string[]; hidden: string[] };

const DEFAULT_LAYOUT: LayoutPrefs = { order: DEFAULT_ORDER, hidden: [] };

function sanitizeLayout(raw: unknown): LayoutPrefs {
  const source = (raw ?? {}) as Partial<LayoutPrefs>;
  const known = new Set(DEFAULT_ORDER);
  const order = Array.isArray(source.order)
    ? source.order.filter((id): id is string => typeof id === "string" && known.has(id))
    : [];
  const complete = [...order, ...DEFAULT_ORDER.filter((id) => !order.includes(id))];
  const untouched =
    complete.length === LEGACY_DEFAULT_ORDER.length &&
    complete.every((id, i) => id === LEGACY_DEFAULT_ORDER[i]);
  const hidden = Array.isArray(source.hidden)
    ? source.hidden.filter((id): id is string => typeof id === "string" && known.has(id))
    : [];
  return { order: untouched ? DEFAULT_ORDER : complete, hidden };
}

const SPAN_CLASS: Record<number, string> = {
  5: "@4xl:col-span-5",
  6: "@4xl:col-span-6",
  7: "@4xl:col-span-7",
  12: "@4xl:col-span-12",
};

type PlacedWidget = { widget: WidgetDef; span: 5 | 6 | 7 | 12 };

function packRows(items: WidgetDef[]): PlacedWidget[] {
  const placed: PlacedWidget[] = [];
  let row: WidgetDef[] = [];
  let used = 0;

  const flush = () => {
    if (row.length === 1) {
      placed.push({ widget: row[0], span: 12 });
    } else if (row.length === 2) {
      const [a, b] = row;
      const free = 12 - a.size - b.size;
      const spanA = (a.size + Math.ceil(free / 2)) as 5 | 6 | 7;
      placed.push({ widget: a, span: spanA }, { widget: b, span: (12 - spanA) as 5 | 6 | 7 });
    }
    row = [];
    used = 0;
  };

  for (const w of items) {
    if (used + w.size > 12) flush();
    row.push(w);
    used += w.size;
    if (used >= 12) flush();
  }
  flush();
  return placed;
}

function useDashboardLayout() {
  const [layout, setLayout] = useState<LayoutPrefs>(DEFAULT_LAYOUT);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_KEY);
      if (raw) setLayout(sanitizeLayout(JSON.parse(raw)));
    } catch {
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    } catch {
    }
  }, [layout]);

  const toggle = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id) ? prev.hidden.filter((h) => h !== id) : [...prev.hidden, id],
    }));
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setLayout((prev) => {
      const i = prev.order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.order.length) return prev;
      const order = [...prev.order];
      [order[i], order[j]] = [order[j], order[i]];
      return { ...prev, order };
    });
  }, []);

  const reset = useCallback(() => setLayout(DEFAULT_LAYOUT), []);

  return { layout, toggle, move, reset };
}

function LayoutMenu({
  layout,
  onToggle,
  onMove,
  onReset,
}: {
  layout: LayoutPrefs;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReset: () => void;
}) {
  const byId = useMemo(() => new Map(WIDGETS.map((w) => [w.id, w])), []);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-surface"
        >
          <SlidersHorizontal className="size-3.5" /> Personnaliser
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <p className="text-xs font-semibold">Cartes du dashboard</p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Réinitialiser
          </button>
        </div>
        <ul className="max-h-[360px] space-y-0.5 overflow-y-auto">
          {layout.order.map((id, i) => {
            const w = byId.get(id);
            if (!w) return null;
            const hidden = layout.hidden.includes(id);
            return (
              <li
                key={id}
                className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-surface/60"
              >
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={hidden ? `Afficher ${w.label}` : `Masquer ${w.label}`}
                >
                  {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs",
                    hidden && "text-muted-foreground line-through",
                  )}
                >
                  {w.label}
                </span>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => onMove(id, -1)}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-25"
                  aria-label="Monter"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={i === layout.order.length - 1}
                  onClick={() => onMove(id, 1)}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-25"
                  aria-label="Descendre"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function DashboardPage() {
  const store = useAppStore();
  const { toggleTask } = store;
  const user = useCurrentUser();
  const [range, setRange] = useState<Range>("7j");
  const { layout, toggle, move, reset } = useDashboardLayout();

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

  const kpis = useMemo(() => buildKpis(src), [src]);
  const data = useMemo<DashData>(
    () => ({
      range,
      setRange,
      src,
      stages: pipelineByStage(src.deals),
      funnel: buildFunnel(src.leads),
      scores: buildScoreBuckets(src.leads),
      channels: buildChannels(src),
      health: workflowHealth(src),
      insights: buildInsights(src),
      priorities: getTopPriorityLeads(src.leads, 5),
      signals: getHotSignals(src.leads, 4),
      toggleTask,
    }),
    [range, src, toggleTask],
  );

  const placed = useMemo(() => {
    const byId = new Map(WIDGETS.map((w) => [w.id, w]));
    const visible = layout.order
      .map((id) => byId.get(id))
      .filter((w): w is WidgetDef => !!w && !layout.hidden.includes(w.id) && w.visible(data));
    return packRows(visible);
  }, [layout, data]);

  const prevLeadCountRef = useRef<number>(store.leads.length);
  const [showKnown, setShowKnown] = useState<boolean>(() => {
    const prefs = readPeoplePreferences();
    return !prefs.hideKnownPeople;
  });

  useEffect(() => {
    const prev = prevLeadCountRef.current;
    const current = store.leads.length;
    prevLeadCountRef.current = current;

    const freshPrefs = readPeoplePreferences();
    const result = syncAutoHideKnownPeople(prev, current, freshPrefs);

    if (result.patch) {
      const next = { ...freshPrefs, ...result.patch };
      writePeoplePreferences(next);
      setShowKnown(!next.hideKnownPeople);

      if (result.justHidden) {
        toast.info("Suggestions de décideurs masquées", {
          description: `Vous avez maintenant ${current} prospects dans votre base. Les suggestions sont masquées automatiquement pour garder la liste lisible. Vous pouvez les réactiver dans les préférences de la section Prospects.`,
          duration: 6000,
        });
      }
    }
  }, [store.leads.length]);

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const description =
    data.insights.length > 0
      ? `${data.insights.length} point${data.insights.length > 1 ? "s" : ""} demande${data.insights.length > 1 ? "nt" : ""} votre attention aujourd'hui.`
      : "Tout est à jour : voici l'état de votre activité.";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-6 pb-10">
      <PageHeader
        eyebrow={todayLabel}
        title={`Bonjour, ${user.firstName}.`}
        description={description}
        actions={
          <>
            <LayoutMenu layout={layout} onToggle={toggle} onMove={move} onReset={reset} />
            <Link
              to="/app/workflows"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-surface"
            >
              <WorkflowIcon className="size-3.5" /> Workflows
            </Link>
            <Link
              to="/app/people/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground btn-tactile"
            >
              <Sparkles className="size-3.5" /> Prospecter
            </Link>
          </>
        }
      />

      <KpiStrip items={kpis} />

      <div className="@container min-w-0">
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-12 @4xl:gap-5">
          {placed.map(({ widget, span }) => (
            <div key={widget.id} className={cn("min-w-0", SPAN_CLASS[span])}>
              {widget.render(data)}
            </div>
          ))}
        </div>
      </div>

      {showKnown && <KnownPeopleExplorer />}
    </div>
  );
}
