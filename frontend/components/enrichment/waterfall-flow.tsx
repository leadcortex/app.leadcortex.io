//frontend\components\enrichment\waterfall-flow.tsx
import { ArrowRight, Check, CircleDashed, Pause, Plus, Sparkles, X } from "lucide-react";
import type { EnrichmentProvider } from "@/lib/enrichment-mock";
import { cn } from "@/lib/utils";
import { ProviderBadge } from "./provider-badge";

export function WaterfallFlow({
  providers,
  onToggle,
  className,
}: {
  providers: EnrichmentProvider[];
  onToggle: (id: string) => void;
  className?: string;
}) {
  const ordered = [...providers].sort((a, b) => a.priority - b.priority);

  return (
    <div className={cn("overflow-x-auto overscroll-x-contain scrollbar-hide", className)}>
      <div className="flex min-w-max items-center gap-2 px-1 py-1">
        {}
        <Endpoint icon={Sparkles} label="Lead" tone="start" />

        {ordered.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <StepArrow label={p.status === "connected" ? "si vide" : "inactif"} />
            <ProviderStep provider={p} onToggle={() => onToggle(p.id)} />
          </div>
        ))}

        <StepArrow label="sinon" />
        <Endpoint icon={Check} label="Enrichi" tone="end" />
      </div>
    </div>
  );
}

function Endpoint({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Check;
  label: string;
  tone: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border px-3.5",
        tone === "start"
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StepArrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
      <ArrowRight className="size-3.5 text-muted-foreground/50" strokeWidth={1.75} />
    </div>
  );
}

function ProviderStep({
  provider,
  onToggle,
}: {
  provider: EnrichmentProvider;
  onToggle: () => void;
}) {
  const isOn = provider.status === "connected";
  const isPaused = provider.status === "paused";
  const isError = provider.status === "error";

  return (
    <button
      type="button"
      onClick={onToggle}
      title={
        isOn
          ? `Désactiver ${provider.name}`
          : isPaused
            ? `Reprendre ${provider.name}`
            : `Activer ${provider.name}`
      }
      className={cn(
        "group relative flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border transition-all",
        isOn
          ? "border-primary/40 bg-primary/5 hover:border-primary"
          : isPaused
            ? "border-amber-500/40 bg-amber-500/5"
            : isError
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-surface/40 hover:border-primary/30",
      )}
    >
      <ProviderBadge slug={provider.slug} size={30} />

      <span
        className={cn(
          "absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full ring-2 ring-background",
          isOn && "bg-emerald-500 text-white",
          isPaused && "bg-amber-500 text-white",
          isError && "bg-destructive text-white",
          !isOn && !isPaused && !isError && "bg-muted-foreground/40 text-background",
        )}
      >
        {isOn ? (
          <Check className="size-2.5" strokeWidth={3} />
        ) : isPaused ? (
          <Pause className="size-2.5" strokeWidth={3} />
        ) : isError ? (
          <X className="size-2.5" strokeWidth={3} />
        ) : (
          <Plus className="size-2.5" strokeWidth={3} />
        )}
      </span>

      <span className="text-[9px] font-mono text-muted-foreground">{provider.costPerLead}c</span>
    </button>
  );
}
