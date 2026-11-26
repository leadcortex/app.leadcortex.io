// frontend/components/enrichment/provider-card.tsx

import { ExternalLink, Pause, Play, Plus, Settings2, Trash2 } from "@/components/icons";

import { Badge } from "@/components/common/ui-primitives";
import { cn } from "@/lib/core/utils";
import type { EnrichmentProvider } from "@/lib/enrichment/mock";
import { FIELD_LABELS, type EnrichableField } from "@/lib/enrichment/metrics";
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
    <article className="rounded-xl border border-border bg-background p-4 md:p-6">
      <div className="flex items-start gap-3">
        <ProviderBadge slug={provider.slug} size={40} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">{provider.name}</h3>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {provider.description}
          </p>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
        {FIELDS.map((f) => {
          const supported = provider.supports.includes(f);
          const value = provider.coverage[f] ?? 0;
          return (
            <li key={f} className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-xs",
                    supported ? "text-muted-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {FIELD_LABELS[f]}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    supported ? "text-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {supported ? `${value} %` : "Non géré"}
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

      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Coût</dt>
          <dd className="mt-1 text-[13px] tabular-nums text-foreground">
            {provider.costPerLead} crédit{provider.costPerLead > 1 ? "s" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Crédits restants</dt>
          <dd className="mt-1 text-[13px] tabular-nums text-foreground">
            {provider.creditsRemaining != null
              ? provider.creditsRemaining.toLocaleString("fr-FR")
              : "Inconnu"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Synchro</dt>
          <dd className="mt-1 truncate text-[13px] text-foreground">
            {provider.lastSync ?? "Jamais"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
            isConnected
              ? "border border-border text-foreground hover:bg-surface/70"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
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
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:bg-surface/70 hover:text-foreground"
        >
          <Settings2 className="size-3.5" /> Configurer
        </button>

        {provider.website && (
          <a
            href={`https://${provider.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:bg-surface/70 hover:text-foreground"
          >
            <ExternalLink className="size-3.5" /> Docs
          </a>
        )}

        <button
          type="button"
          onClick={onRemove}
          title="Retirer cette source"
          aria-label="Retirer cette source"
          className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
      className="flex h-full flex-col items-start gap-4 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-surface/70"
    >
      <div className="flex w-full items-start gap-3">
        <ProviderBadge slug={provider.slug} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{provider.name}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {provider.description}
          </p>
        </div>
      </div>
      <div className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
        <Plus className="size-3.5" /> Activer
      </div>
    </button>
  );
}
