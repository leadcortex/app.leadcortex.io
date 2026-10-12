//frontend\components\suggestion-cortex.tsx
import { useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  Wand2,
  Send,
  Mail,
  Phone,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Target,
  Workflow,
  BarChart3,
  Eye,
  FileInput,
  Bookmark,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Zap,
  ChevronRight,
  Flame,
  Clock,
  PenLine,
  Search,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";
import { BrandLogoMark } from "@/components/brand-logo-mark";
import { useAppStore } from "@/lib/store";
import { getOnboardingSnapshot, type OnboardingSnapshot } from "@/lib/onboarding";
import { LeadMascot } from "@/components/ui/lead-mascot";
import { useSidebarSide, oppositeSide } from "@/lib/layout-prefs";

const STORAGE_KEY = "cortex.suggestion.width";

const MIN_W = 180;
const MAX_W = 320;
const DEFAULT_W = 260;
const GUTTER_W = 8;
const AUTO_COLLAPSE_THRESHOLD = 140;

const clamp = (w: number) => Math.min(MAX_W, Math.max(MIN_W, w));

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type Shortcut = { to: string; label: string; icon: IconType };

const SHORTCUTS: Shortcut[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/people", label: "Prospects", icon: Users },
  { to: "/app/companies", label: "Entreprises", icon: Building2 },
  { to: "/app/lists", label: "Listes", icon: ListChecks },
  { to: "/app/enrichment", label: "Enrichissement", icon: Wand2 },
  { to: "/app/sequences", label: "Séquences", icon: Send },
  { to: "/app/emails", label: "Emails", icon: Mail },
  { to: "/app/calls", label: "Appels", icon: Phone },
  { to: "/app/tasks", label: "Tâches", icon: CheckSquare },
  { to: "/app/meetings", label: "Meetings", icon: CalendarDays },
  { to: "/app/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/app/deals", label: "Opportunités", icon: Target },
  { to: "/app/workflows", label: "Workflows", icon: Workflow },
  { to: "/app/analytics", label: "Analyses", icon: BarChart3 },
  { to: "/app/visitors", label: "Visiteurs", icon: Eye },
  { to: "/app/forms", label: "Formulaires", icon: FileInput },
  { to: "/app/saved", label: "Sauvegardés", icon: Bookmark },
];

type Suggestion = {
  icon: IconType;
  title: string;
  desc: string;
  tag: string;
  accent: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Sparkles,
    title: "Rédiger un email de relance",
    desc: "Ton chaleureux, orienté bénéfice client.",
    tag: "Email",
    accent: "#8b5cf6",
  },
  {
    icon: TrendingUp,
    title: "Repérer les signaux d'achat",
    desc: "3 prospects montrent une intention forte cette semaine.",
    tag: "Signaux",
    accent: "#10b981",
  },
  {
    icon: Zap,
    title: "Enrichir 12 nouveaux prospects",
    desc: "Emails, postes et téléphones manquants détectés.",
    tag: "Enrichir",
    accent: "#f59e0b",
  },
  {
    icon: Lightbulb,
    title: "Proposer un script d'appel",
    desc: "Adapté au segment SaaS B2B — 4 objections couvertes.",
    tag: "Appels",
    accent: "#0ea5e9",
  },
  {
    icon: Flame,
    title: "Prioriser les leads chauds",
    desc: "5 leads avec score > 80 à traiter aujourd'hui.",
    tag: "Priorité",
    accent: "#ef4444",
  },
  {
    icon: Clock,
    title: "Planifier les relances",
    desc: "8 conversations sans réponse depuis plus de 5 jours.",
    tag: "Relances",
    accent: "#6366f1",
  },
  {
    icon: PenLine,
    title: "Personnaliser une séquence",
    desc: "Variantes générées selon l'industrie et le poste.",
    tag: "Séquences",
    accent: "#ec4899",
  },
  {
    icon: Search,
    title: "Trouver des prospects similaires",
    desc: "Lookalike basé sur tes 10 meilleurs clients.",
    tag: "Prospection",
    accent: "#14b8a6",
  },
  {
    icon: Target,
    title: "Analyser le pipeline",
    desc: "Points de friction et deals à risque cette semaine.",
    tag: "Pipeline",
    accent: "#a855f7",
  },
  {
    icon: MessageSquare,
    title: "Résumer les conversations",
    desc: "Synthèse des échanges et prochaines actions.",
    tag: "Résumé",
    accent: "#06b6d4",
  },
];

export function SuggestionCortex() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isDashboard = pathname === "/app" || pathname === "/app/";

  const sidebarSide = useSidebarSide();
  const assistantSide = oppositeSide(sidebarSide);
  const isLeft = assistantSide === "left";

  const store = useAppStore();

  const snapshot = getOnboardingSnapshot({
    leads: store.leads,
    companies: store.companies,
    sequences: store.sequences,
    workflows: store.workflows,
    deals: store.deals,
  });
  const isFirstRun = snapshot.level === "empty";

  const [width, setWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_W;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : NaN;
    return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT_W;
  });
  const widthRef = useRef(width);
  widthRef.current = width;

  const [collapsed, setCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = width;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const onMove = (ev: PointerEvent) => {
      const next = isLeft ? ev.clientX : window.innerWidth - ev.clientX;
      if (next < AUTO_COLLAPSE_THRESHOLD) {
        setCollapsed(true);
        setResizing(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        return;
      }
      setWidth(clamp(next));
    };
    const onUp = () => {
      setResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      try {
        window.localStorage.setItem(STORAGE_KEY, String(widthRef.current));
      } catch {
        /* Intentionally ignored. */
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    void startW;
    void startX;
  };

  const startResizeFromCollapsed = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    let dragged = false;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const cleanup = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    const onMove = (ev: PointerEvent) => {
      const dx = isLeft ? ev.clientX - startX : startX - ev.clientX;
      if (dx > 8) {
        if (!dragged) {
          dragged = true;
          setCollapsed(false);
        }
        const next = isLeft ? ev.clientX : window.innerWidth - ev.clientX;
        setWidth(clamp(next));
        try {
          window.localStorage.setItem(STORAGE_KEY, String(clamp(next)));
        } catch {
          /* Intentionally ignored. */
        }
      }
    };
    const onUp = () => {
      if (!dragged) setCollapsed(false);
      cleanup();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  if (!isDashboard) return null;

  if (collapsed) {
    return (
      <div className="hidden shrink-0 lg:flex self-stretch">
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Ouvrir Suggestion Cortex"
          title="Cliquer pour ouvrir · glisser vers l'extérieur pour ouvrir et ajuster"
          onPointerDown={startResizeFromCollapsed}
          className="group flex w-3 shrink-0 cursor-ew-resize touch-none select-none items-center justify-center"
        >
          <span className="h-24 w-1 rounded-full bg-foreground/20 transition-all duration-150 group-hover:h-40 group-hover:bg-primary/70" />
        </div>
      </div>
    );
  }

  const gutter = (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner le panneau Suggestion Cortex"
      title="Glisser pour redimensionner · tirer à fond pour replier · double-clic pour réinitialiser"
      onPointerDown={startResize}
      onDoubleClick={() => {
        setWidth(DEFAULT_W);
        try {
          window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_W));
        } catch {
          /* Intentionally ignored. */
        }
      }}
      className="group relative z-30 flex w-2 shrink-0 cursor-ew-resize touch-none select-none items-center justify-center"
    >
      <span
        className={cn(
          "pointer-events-none w-1 rounded-full bg-foreground/30 transition-all duration-150",
          "h-16 group-hover:h-32 group-hover:bg-primary/70",
          resizing && "h-40 bg-primary",
        )}
      />
    </div>
  );

  const panel = (
    <aside className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
        {}
        <header className="flex shrink-0 items-center gap-2 border-b border-border/60 px-2 py-2 md:px-3 md:py-2.5">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary md:size-7">
            <Sparkles className="size-3.5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium md:text-[12.5px]">
              {isFirstRun ? "Guide de démarrage" : "Suggestion Cortex"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {isFirstRun ? "4 étapes pour commencer" : "Idées & raccourcis"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Replier le panneau"
            title="Replier"
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            {isLeft ? (
              <ChevronRight className="size-3.5 rotate-180" strokeWidth={1.8} />
            ) : (
              <ChevronRight className="size-3.5" strokeWidth={1.8} />
            )}
          </button>
        </header>

        {isFirstRun ? <OnboardingChecklist snapshot={snapshot} /> : <DefaultSuggestionsPanel />}

        {}
        <footer className="shrink-0 border-t border-border/60 p-2">
          <button
            type="button"
            onClick={() =>
              openAssistant({ prompt: isFirstRun ? "Comment démarrer ?" : "Que me suggères-tu ?" })
            }
            className="flex w-full min-w-0 items-center justify-center gap-1.5 rounded-lg bg-foreground px-2 py-2 text-[11px] font-medium text-background transition-opacity hover:opacity-90 md:px-3 md:text-[11.5px]"
          >
            <BrandLogoMark size={14} />
            <span className="truncate">Demander à Cortex</span>
          </button>
        </footer>
      </div>
    </aside>
  );

  return (
    <div
      className={cn("hidden shrink-0 lg:flex self-stretch min-w-0", isLeft && "flex-row-reverse")}
      style={{ width: width + GUTTER_W }}
    >
      {gutter}
      {panel}
    </div>
  );
}

function OnboardingChecklist({ snapshot }: { snapshot: OnboardingSnapshot }) {
  const { steps, completedCount, nextStep } = snapshot;

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
      <div className="mb-3 flex min-w-0 items-center gap-2.5 rounded-xl bg-primary/[0.07] p-2.5">
        <LeadMascot
          pose={completedCount === 0 ? "curious" : "happy"}
          className="h-14 w-auto shrink-0"
        />
        <div className="min-w-0">
          <p className="text-pretty break-words text-[12px] font-semibold leading-snug">
            {nextStep ? "Prêt à démarrer ?" : "Tout est prêt !"}
          </p>
          {nextStep && (
            <p className="mt-0.5 text-pretty break-words text-[10.5px] leading-snug text-muted-foreground">
              Commencez par : {nextStep.label.toLowerCase()}.
            </p>
          )}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Progression
        </p>
        <p className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
          {completedCount} / {steps.length}
        </p>
      </div>
      <div className="mb-3 flex gap-1" aria-hidden="true">
        {steps.map((step) => (
          <span
            key={step.id}
            className={cn("h-1 flex-1 rounded-full", step.done ? "bg-primary" : "bg-primary/15")}
          />
        ))}
      </div>

      <ol className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.href}
              className={cn(
                "group flex min-w-0 items-start gap-2 rounded-lg border p-2 transition-colors",
                step.done
                  ? "border-success/25 bg-success/[0.04] hover:bg-success/[0.07]"
                  : "border-border/70 bg-background hover:border-primary/30 hover:bg-surface/60",
              )}
            >
              <span className="mt-0.5 shrink-0">
                {step.done ? (
                  <CheckCircle2 className="size-3.5 text-success" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-balance break-words text-[11.5px] font-medium leading-snug",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.index}. {step.label}
                </span>
                <span className="mt-0.5 block text-pretty break-words text-[10.5px] leading-relaxed text-muted-foreground">
                  {step.overview}
                </span>
              </span>
              {!step.done && (
                <ArrowRight className="mt-0.5 size-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DefaultSuggestionsPanel() {
  return (
    <>
      <section className="flex min-h-0 min-w-0 flex-[2] flex-col border-b border-border/60">
        <p className="shrink-0 px-2 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:px-3">
          Raccourcis
        </p>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2.5 md:px-2.5">
          <div className="flex min-w-0 flex-col gap-1">
            {SHORTCUTS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2 py-1.5 text-[11px] transition-colors hover:border-primary/30 hover:bg-surface/60"
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="truncate">{s.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-[3] flex-col">
        <p className="shrink-0 px-2 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:px-3">
          Suggestions
        </p>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2.5 md:px-2.5">
          <div className="flex min-w-0 flex-col gap-1.5">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => openAssistant({ prompt: s.title })}
                  className="group flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-lg border border-border/70 bg-background p-2 text-left transition-colors hover:bg-surface/60 md:rounded-xl md:p-2.5"
                >
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-lg md:size-7"
                    style={{
                      color: s.accent,
                      backgroundColor: `color-mix(in oklab, ${s.accent} 14%, transparent)`,
                    }}
                  >
                    <Icon className="size-3.5" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium md:text-[12px]">
                        {s.title}
                      </span>
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                        style={{
                          color: s.accent,
                          backgroundColor: `color-mix(in oklab, ${s.accent} 12%, transparent)`,
                        }}
                      >
                        {s.tag}
                      </span>
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[10.5px] leading-relaxed text-muted-foreground">
                      {s.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
