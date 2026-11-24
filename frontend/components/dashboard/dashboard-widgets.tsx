// frontend/components/dashboard/dashboard-widgets.tsx

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Circle,
  Radio,
  Sparkles,
} from "@/components/icons";
import { Badge } from "@/components/common/ui-primitives";
import { ChartCard, ScrollFrame } from "@/components/charts/charts";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { cn } from "@/lib/core/utils";
import { formatEuro } from "@/lib/analytics/dashboard-metrics";
import type { Insight, Tone } from "@/lib/analytics/dashboard-insights";
import type { SignalGroup } from "@/lib/analytics/dashboard-metrics-people";
import type { Deal, Lead, Meeting, Task } from "@/lib/data/mock-data";

const TONE_DOT: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-[var(--warning,var(--chart-2))]",
  destructive: "bg-destructive",
};

function SeeAll({ to, children = "Voir tout" }: { to: Insight["href"]; children?: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {children} <ArrowUpRight className="size-3" />
    </Link>
  );
}

function MoreLink({ to, hidden, noun }: { to: Insight["href"]; hidden: number; noun: string }) {
  if (hidden <= 0) return null;
  return (
    <Link
      to={to}
      className="mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
    >
      Voir {hidden} {noun}
      {hidden > 1 ? "s" : ""} de plus <ArrowRight className="size-3" />
    </Link>
  );
}

function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-surface/20 px-4 py-8 text-center">
      <span className="text-muted-foreground/40">{icon}</span>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

const rowClass =
  "group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-surface/50";

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "Haute",
  med: "Moyenne",
  low: "Basse",
};

export function InsightsWidget({ insights }: { insights: Insight[] }) {
  return (
    <ChartCard
      className="h-full"
      title="À traiter maintenant"
      subtitle="Recommandations calculées sur vos données"
    >
      <ul className="space-y-1.5">
        {insights.map((i) => (
          <li key={i.id}>
            <Link to={i.href} className={cn(rowClass, "items-start")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE_DOT[i.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{i.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{i.detail}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 self-center whitespace-nowrap text-xs text-primary">
                <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 sm:inline [@media(hover:none)]:opacity-100">
                  {i.cta}
                </span>
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function PrioritiesWidget({ leads }: { leads: Lead[] }) {
  return (
    <ChartCard
      className="h-full"
      title="Prospects prioritaires"
      subtitle="Score élevé ou signal d'intention détecté"
      actions={<SeeAll to="/app/people" />}
    >
      {leads.length === 0 ? (
        <Empty icon={<Sparkles className="size-6" />}>
          Aucun prospect prioritaire pour l'instant.
        </Empty>
      ) : (
        <ScrollFrame
          fit="content"
          minWidth={400}
          label="Prospects prioritaires, défilement horizontal"
        >
          <ul className="space-y-1">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link to="/app/people/$id" params={{ id: lead.id }} className={rowClass}>
                  <LetterAvatar name={lead.name} size={36} shape="circle" />
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-nowrap text-sm font-medium transition-colors group-hover:text-primary">
                      {lead.name}
                    </p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {lead.title} · {lead.company}
                    </p>
                    {lead.signal && (
                      <p className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11px] text-primary">
                        <Radio className="size-3 shrink-0" />
                        <span>{lead.signal}</span>
                      </p>
                    )}
                  </div>
                  {typeof lead.score === "number" && (
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums",
                        lead.score >= 9
                          ? "bg-primary/15 text-primary"
                          : lead.score >= 8
                            ? "bg-[var(--warning,var(--chart-2))]/15 text-[var(--warning,var(--chart-2))]"
                            : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {lead.score.toFixed(1)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </ScrollFrame>
      )}
    </ChartCard>
  );
}

export function SignalsWidget({ groups }: { groups: SignalGroup[] }) {
  const max = groups[0]?.count || 1;
  return (
    <ChartCard
      className="h-full"
      title="Signaux chauds"
      subtitle="Événements détectés chez vos prospects"
    >
      <ul className="space-y-4">
        {groups.map((g) => (
          <li key={g.signal}>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium leading-snug">{g.signal}</p>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-primary">
                {g.count}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round((g.count / max) * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.leads.slice(0, 3).map((l) => (
                <Link
                  key={l.id}
                  to="/app/people/$id"
                  params={{ id: l.id }}
                  className="max-w-full rounded-full bg-surface/70 px-2.5 py-1 text-[11px] leading-tight text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {l.name}
                </Link>
              ))}
              {g.leads.length > 3 && (
                <span className="rounded-full bg-surface/70 px-2.5 py-1 text-[11px] leading-tight text-muted-foreground">
                  +{g.leads.length - 3}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

const TASKS_SHOWN = 6;

export function TasksWidget({
  tasks,
  onToggle,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
}) {
  const open = tasks.filter((t) => !t.done).length;
  return (
    <ChartCard
      className="h-full"
      title="Tâches"
      subtitle={`${open} à faire sur ${tasks.length}`}
      actions={<SeeAll to="/app/tasks" />}
    >
      <ScrollFrame fit="content" minWidth={380} label="Tâches, défilement horizontal">
        <ul className="space-y-0.5">
          {tasks.slice(0, TASKS_SHOWN).map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-surface/50"
            >
              <button
                type="button"
                onClick={() => onToggle(t.id)}
                className="shrink-0"
                aria-label={t.done ? "Marquer à faire" : "Marquer terminée"}
              >
                {t.done ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <Circle className="size-4 text-muted-foreground transition-colors hover:text-primary" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "whitespace-nowrap text-sm",
                    t.done && "text-muted-foreground line-through",
                  )}
                >
                  {t.title}
                </p>
                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  {t.contact} · {t.due}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    t.priority === "high"
                      ? "bg-destructive"
                      : t.priority === "med"
                        ? "bg-[var(--warning,var(--chart-2))]"
                        : "bg-muted-foreground/40",
                  )}
                />
                {PRIORITY_LABEL[t.priority]}
              </span>
            </li>
          ))}
        </ul>
      </ScrollFrame>
      <MoreLink to="/app/tasks" hidden={tasks.length - TASKS_SHOWN} noun="tâche" />
    </ChartCard>
  );
}

const MEETINGS_SHOWN = 4;

export function MeetingsWidget({ meetings }: { meetings: Meeting[] }) {
  return (
    <ChartCard
      className="h-full"
      title="Prochains rendez-vous"
      actions={<SeeAll to="/app/meetings" />}
    >
      {meetings.length === 0 ? (
        <Empty icon={<Calendar className="size-6" />}>Aucun rendez-vous planifié.</Empty>
      ) : (
        <>
          <ScrollFrame
            fit="content"
            minWidth={400}
            label="Prochains rendez-vous, défilement horizontal"
          >
            <ul className="space-y-1">
              {meetings.slice(0, MEETINGS_SHOWN).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface/50"
                >
                  <div className="grid min-w-14 shrink-0 place-items-center rounded-lg border border-border bg-surface/50 px-2 py-1.5">
                    <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {m.date}
                    </span>
                    <span className="font-mono text-xs font-semibold tabular-nums">{m.time}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-nowrap text-sm font-medium">{m.title}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {m.with} · {m.company}
                    </p>
                  </div>
                  <Badge tone="muted" className="shrink-0 whitespace-nowrap">
                    {m.duration}
                  </Badge>
                </li>
              ))}
            </ul>
          </ScrollFrame>
          <MoreLink
            to="/app/meetings"
            hidden={meetings.length - MEETINGS_SHOWN}
            noun="rendez-vous"
          />
        </>
      )}
    </ChartCard>
  );
}

const DEALS_SHOWN = 5;

const STAGE_TONE: Record<Deal["stage"], "muted" | "primary" | "success" | "destructive"> = {
  qualified: "muted",
  proposal: "muted",
  negotiation: "primary",
  won: "success",
  lost: "destructive",
};

const STAGE_TEXT: Record<Deal["stage"], string> = {
  qualified: "Qualifié",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  lost: "Perdu",
};

export function DealsWidget({ deals }: { deals: Deal[] }) {
  return (
    <ChartCard
      className="h-full"
      title="Opportunités récentes"
      subtitle="Montant et probabilité de signature"
      actions={<SeeAll to="/app/deals">Ouvrir le pipeline</SeeAll>}
    >
      <ScrollFrame
        fit="content"
        minWidth={640}
        label="Opportunités récentes, défilement horizontal"
      >
        <ul className="space-y-1">
          {deals.slice(0, DEALS_SHOWN).map((d) => (
            <li key={d.id}>
              <Link to="/app/deals" className={rowClass}>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-sm font-medium">{d.name}</p>
                  <p className="whitespace-nowrap text-xs text-muted-foreground">
                    {d.company} · {d.close}
                  </p>
                </div>
                <div className="flex w-32 shrink-0 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        d.probability >= 70 ? "bg-success" : "bg-primary",
                      )}
                      style={{ width: `${d.probability}%` }}
                    />
                  </div>
                  <span className="w-10 whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                    {d.probability}&nbsp;%
                  </span>
                </div>
                <Badge tone={STAGE_TONE[d.stage]} className="shrink-0 whitespace-nowrap">
                  {STAGE_TEXT[d.stage]}
                </Badge>
                <span className="min-w-24 shrink-0 whitespace-nowrap text-right font-mono text-sm font-medium tabular-nums">
                  {formatEuro(d.amount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollFrame>
      <MoreLink to="/app/deals" hidden={deals.length - DEALS_SHOWN} noun="opportunité" />
    </ChartCard>
  );
}
