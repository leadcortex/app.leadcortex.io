//frontend\components\enrichment\provider-card.tsx
import { ExternalLink, Pause, Play, Settings2, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui-primitives";
import { cn } from "@/lib/utils";
import type { EnrichmentProvider } from "@/lib/enrichment-mock";
import { FIELD_LABELS, type EnrichableField } from "@/lib/enrichment-metrics";
import { ProviderBadge } from "./provider-badge";

const FIELDS: EnrichableField[] = ["email", "phone", "linkedin", "company"];

const statusTone: Record<
  EnrichmentProvider["status"],
  { label: string; tone: "primary" | "muted" | "warning" | "destructive" }
> = {
  connected: { label: "Actif", tone: "primary" },
  available: { label: "Disponible", tone: "muted" },
  paused: { label: "En pause", tone: "warning" },
  error: { label: "Erreur", tone: "destructive" },
};

export function ProviderCard({
  provider,
  onToggle,
  onConfigure,
  onRemove,
}: {
  provider: EnrichmentProvider;
  onToggle: () => void;
  onConfigure: () => void;
  onRemove: () => void;
}) {
  const st = statusTone[provider.status];
  const isConnected = provider.status === "connected";

  return (
    <article className="rounded-2xl border border-border bg-background p-4 md:p-5 transition-all hover:border-border/80">
      {}
      <div className="flex items-start gap-3">
        <ProviderBadge slug={provider.slug} size={40} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium md:text-base">{provider.name}</h3>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground md:text-xs">
            {provider.description}
          </p>
        </div>
      </div>

      {}
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {FIELDS.map((f) => {
          const supported = provider.supports.includes(f);
          const value = provider.coverage[f] ?? 0;
          return (
            <li key={f} className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[10px] uppercase tracking-wider",
                    supported ? "text-muted-foreground" : "text-muted-foreground/40 line-through",
                  )}
                >
                  {FIELD_LABELS[f]}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10px] tabular-nums",
                    supported ? "text-foreground" : "text-muted-foreground/40",
                  )}
                >
                  {supported ? `${value}%` : "—"}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface">
                {supported && (
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${value}%` }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[10px] md:text-[11px]">
        <div>
          <dt className="text-muted-foreground">Coût</dt>
          <dd className="mt-0.5 font-mono text-foreground">
            {provider.costPerLead} crédit{provider.costPerLead > 1 ? "s" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Crédits</dt>
          <dd className="mt-0.5 font-mono text-foreground">
            {provider.creditsRemaining != null
              ? provider.creditsRemaining.toLocaleString("fr-FR")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sync</dt>
          <dd className="mt-0.5 truncate text-foreground">{provider.lastSync ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            isConnected
              ? "border border-border text-foreground hover:bg-surface"
              : "bg-primary text-primary-foreground hover:brightness-110",
          )}
        >
          {isConnected ? (
            <>
              <Pause className="size-3.5" /> Mettre en pause
            </>
          ) : (
            <>
              <Play className="size-3.5" /> Activer
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onConfigure}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <Settings2 className="size-3.5" /> Configurer
        </button>

        {provider.website && (
          <a
            href={`https://${provider.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <ExternalLink className="size-3.5" /> Docs
          </a>
        )}

        <button
          type="button"
          onClick={onRemove}
          title="Retirer ce provider"
          className="ml-auto inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

export function ProviderDiscoveryCard({
  provider,
  onActivate,
}: {
  provider: EnrichmentProvider;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-surface/30 p-4 text-left transition-all hover:border-primary/40 hover:bg-surface/60"
    >
      <div className="flex w-full items-start gap-3">
        <ProviderBadge slug={provider.slug} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{provider.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
            {provider.description}
          </p>
        </div>
      </div>
      <div className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
        <Zap className="size-3.5" /> Activer
      </div>
    </button>
  );
}
