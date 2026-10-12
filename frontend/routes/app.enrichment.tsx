//frontend\routes\app.enrichment.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Badge } from "@/components/ui-primitives";
import { EnrichmentSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

import {
  DEFAULT_CREDITS_TOTAL,
  DEFAULT_CREDITS_USED,
  DEFAULT_PROVIDERS,
  type EnrichmentJob,
  type EnrichmentProvider,
} from "@/lib/enrichment-mock";
import { aggregateCoverage, aggregateKpis } from "@/lib/enrichment-metrics";
import {
  fetchJobs,
  fetchProviders,
  fetchWallet,
  rechargeCreditsApi,
  reorderProvidersApi,
  updateProviderApi,
} from "@/lib/enrichment-api";

import { WaterfallFlow } from "@/components/enrichment/waterfall-flow";
import { ProviderCard, ProviderDiscoveryCard } from "@/components/enrichment/provider-card";
import { FieldCoverage } from "@/components/enrichment/field-coverage";
import { EnrichmentLog } from "@/components/enrichment/enrichment-log";
import { CreditsWallet } from "@/components/enrichment/credits-wallet";
import { ProviderActivateDialog } from "@/components/enrichment/provider-activate-dialog";

export const Route = createFileRoute("/app/enrichment")({
  head: () => ({
    meta: [
      { title: "Enrichissement — LeadCortex" },
      {
        name: "description",
        content:
          "Waterfall d'enrichissement : Apollo, Hunter, Dropcontact, Kaspr — un seul crédit prélevé quand un provider trouve.",
      },
      { property: "og:title", content: "Enrichissement — LeadCortex" },
      {
        property: "og:description",
        content: "Un waterfall intelligent. Vous ne payez que ce qui trouve.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => <EnrichmentSkeleton />,
  component: EnrichmentPage,
});

type Range = "7j" | "30j" | "90j";

function EnrichmentPage() {
  const [providers, setProviders] = useState<EnrichmentProvider[]>(DEFAULT_PROVIDERS);
  const [jobs, setJobs] = useState<EnrichmentJob[]>([]);
  const [range, setRange] = useState<Range>("30j");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [wallet, setWallet] = useState({
    total: DEFAULT_CREDITS_TOTAL,
    used: DEFAULT_CREDITS_USED,
  });

  const [activateOpen, setActivateOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<EnrichmentProvider | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, w] = await Promise.all([fetchProviders(), fetchWallet()]);
        if (cancelled) return;
        setProviders(p);
        setWallet(w);
      } catch (err) {
        toast.error("Impossible de charger les providers");
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingJobs(true);
    (async () => {
      try {
        const list = await fetchJobs({ range, status: statusFilter });
        if (!cancelled) setJobs(list);
      } catch (err) {
        toast.error("Impossible de charger l'historique");
        console.error(err);
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, statusFilter]);

  const connected = useMemo(
    () => providers.filter((p) => p.status === "connected").sort((a, b) => a.priority - b.priority),
    [providers],
  );
  const available = useMemo(
    () => providers.filter((p) => p.status === "available").sort((a, b) => a.priority - b.priority),
    [providers],
  );
  const coverage = useMemo(() => aggregateCoverage(providers), [providers]);
  const kpis = useMemo(() => aggregateKpis(providers, jobs), [providers, jobs]);

  const hasAnyActive = connected.length > 0;

  const toggleProvider = useCallback(
    async (id: string) => {
      const current = providers.find((p) => p.id === id);
      if (!current) return;
      const nextStatus =
        current.status === "connected"
          ? "paused"
          : current.status === "paused"
            ? "connected"
            : "connected";

      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));

      try {
        await updateProviderApi(id, { status: nextStatus });
        toast.success(
          nextStatus === "connected" ? `${current.name} activé` : `${current.name} mis en pause`,
        );
      } catch {
        // rollback
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: current.status } : p)),
        );
        toast.error("Échec de la mise à jour");
      }
    },
    [providers],
  );

  const activateMany = useCallback(
    async (ids: string[]) => {
      // Optimistic
      setProviders((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status: "connected" } : p)),
      );

      try {
        await Promise.all(ids.map((id) => updateProviderApi(id, { status: "connected" })));
        // On re-trie par priorité existante
        await reorderProvidersApi(providers.map((p) => p.id));
        toast.success(
          `${ids.length} provider${ids.length > 1 ? "s" : ""} activé${ids.length > 1 ? "s" : ""}`,
        );
      } catch {
        toast.error("Échec de l'activation");
      }
    },
    [providers],
  );

  const removeProvider = useCallback(async (provider: EnrichmentProvider) => {
    setProviders((prev) => prev.filter((p) => p.id !== provider.id));
    try {
      // BACKEND: DELETE /api/enrichment/providers/:id
      await updateProviderApi(provider.id, { status: "available" });
      toast.success(`${provider.name} retiré`);
    } catch {
      setProviders((prev) => [...prev, provider]);
      toast.error("Échec de la suppression");
    }
  }, []);

  const recharge = useCallback(async () => {
    try {
      const res = await rechargeCreditsApi(200);
      setWallet((w) => ({ ...w, total: res.total }));
      toast.success("+200 crédits ajoutés");
    } catch {
      toast.error("Échec du rechargement");
    }
  }, []);

  /* --- Rendu --- */

  // Empty state : aucun provider actif
  if (!hasAnyActive) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Header onActivate={() => setActivateOpen(true)} hasProviders={providers.length > 0} />

        <div className="relative isolate overflow-hidden rounded-2xl border border-border/70">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-background to-primary/10"
          />
          <div className="relative z-10 bg-background/40 backdrop-blur-[1px]">
            <EmptyState
              icon={Wand2}
              title="Aucun provider activé"
              description="Activez votre premier provider d'enrichissement pour récupérer automatiquement les emails, téléphones et profils LinkedIn de vos prospects."
              action={{
                label: "Activer un provider",
                onClick: () => setActivateOpen(true),
                icon: Zap,
              }}
              size="lg"
            />
          </div>
        </div>

        {available.length > 0 && (
          <section className="mt-4 md:mt-6">
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Disponibles
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {available.map((p) => (
                <ProviderDiscoveryCard
                  key={p.id}
                  provider={p}
                  onActivate={() => activateMany([p.id])}
                />
              ))}
            </div>
          </section>
        )}

        <ProviderActivateDialog
          open={activateOpen}
          onOpenChange={setActivateOpen}
          providers={available.length > 0 ? available : providers}
          onActivate={activateMany}
        />
      </div>
    );
  }

  // Page complète
  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <Header onActivate={() => setActivateOpen(true)} hasProviders />

      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
        <Kpi
          label="Taux de match"
          value={`${kpis.matchRate.toFixed(1)}%`}
          hint={`${kpis.successCount} / ${kpis.totalJobs} jobs`}
          tone="primary"
        />
        <Kpi label="Coût moyen" value={`${kpis.costPerMatch.toFixed(2)}c`} hint="par lead trouvé" />
        <Kpi
          label="Crédits consommés"
          value={kpis.totalCredits.toLocaleString("fr-FR")}
          hint={`sur ${range}`}
        />
        <Kpi
          label="Waterfall efficiency"
          value={`${kpis.waterfallEfficiency.toFixed(0)}%`}
          hint={`résolus par ${connected[0]?.name.split(" ")[0] ?? "—"}`}
        />
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-background p-4 md:mb-8 md:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold md:text-base">Le waterfall</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">
              Chaque provider est essayé dans l'ordre. Un crédit est prélevé uniquement quand un
              résultat est trouvé.
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface/40 px-2.5 py-1 text-[10px] text-muted-foreground md:inline-flex">
            <Zap className="size-3 text-primary" />
            {connected.length} actif{connected.length > 1 ? "s" : ""}
          </span>
        </div>

        <WaterfallFlow providers={providers} onToggle={(id) => void toggleProvider(id)} />

        <p className="mt-3 text-[10px] text-muted-foreground">
          Astuce : cliquez sur un provider pour l'activer ou le mettre en pause. Le glisser-déposer
          arrive dans une prochaine mise à jour.
        </p>
      </section>

      <section className="mb-6 md:mb-8">
        <div className="mb-3">
          <h2 className="text-sm font-semibold md:text-base">Couverture par champ</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">
            Le pourcentage maximum atteignable avec les providers actuellement actifs.
          </p>
        </div>
        <FieldCoverage providers={providers} coverage={coverage} />
      </section>

      <section className="mb-6 md:mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold md:text-base">Providers actifs</h2>
          <button
            type="button"
            onClick={() => setActivateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <Plus className="size-3.5" /> Ajouter
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {connected.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onToggle={() => void toggleProvider(p.id)}
              onConfigure={() => toast.info(`Configuration de ${p.name} — bientôt disponible`)}
              onRemove={() => setConfirmRemove(p)}
            />
          ))}
        </div>
      </section>

      {available.length > 0 && (
        <section className="mb-6 md:mb-8">
          <div className="mb-3">
            <h2 className="text-sm font-semibold md:text-base">Disponibles</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">
              Ajoutez ces sources pour étendre votre couverture.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((p) => (
              <ProviderDiscoveryCard
                key={p.id}
                provider={p}
                onActivate={() => void activateMany([p.id])}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold md:text-base">Historique</h2>
            <div className="flex items-center gap-2">
              <RangeToggle value={range} onChange={setRange} />
              <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>
          {loadingJobs ? (
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="size-3.5 animate-spin" /> Chargement…
              </div>
            </div>
          ) : (
            <EnrichmentLog jobs={jobs} />
          )}
        </section>

        <aside className="space-y-4">
          <CreditsWallet total={wallet.total} used={wallet.used} onRecharge={recharge} />

          <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Suggestion
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {connected.length >= 3
                ? `Vos ${connected.length} providers couvrent ${coverage.email}% des emails. Ajoutez Kaspr pour pousser le téléphone à +92%.`
                : `Ajoutez un second provider au waterfall pour gagner en couverture sans coût supplémentaire sur les leads déjà trouvés.`}
            </p>
            <button
              type="button"
              onClick={() => setActivateOpen(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface/40 px-3 py-2 text-[11px] transition-colors hover:bg-surface"
            >
              Voir les providers <ArrowRight className="size-3.5" />
            </button>
          </div>
        </aside>
      </div>

      <ProviderActivateDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        providers={providers.filter((p) => p.status !== "connected")}
        onActivate={activateMany}
      />

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) void removeProvider(confirmRemove);
          setConfirmRemove(null);
        }}
        title={`Retirer ${confirmRemove?.name ?? ""} du waterfall ?`}
        description="Vous pourrez le réactiver à tout moment depuis la section « Disponibles »."
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sous-composants                                                           */
/* -------------------------------------------------------------------------- */

function Header({ onActivate, hasProviders }: { onActivate: () => void; hasProviders: boolean }) {
  return (
    <div className="mb-4 animate-fade-in-up md:mb-10">
      <PageHeader
        eyebrow="Enrichissement"
        title="Le waterfall."
        description="Un crédit prélevé uniquement quand un provider trouve. Essayez dans l'ordre, payez à l'usage."
        actions={
          <button
            type="button"
            onClick={onActivate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[10px] text-background transition-opacity hover:opacity-90 md:text-xs"
          >
            <Plus className="size-3.5" />
            {hasProviders ? "Ajouter un provider" : "Activer un provider"}
          </button>
        }
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary";
}) {
  return (
    <div className="kpi-card rounded-2xl border border-border bg-background p-3 md:p-5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground md:text-[11px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-xl tabular-nums md:text-3xl",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">{hint}</p>}
    </div>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  const opts: Range[] = ["7j", "30j", "90j"];
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface/40 p-0.5">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-medium transition-colors md:text-[11px]",
            value === o
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function StatusFilter({
  value,
  onChange,
}: {
  value: "all" | "success" | "failed";
  onChange: (v: "all" | "success" | "failed") => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface/40 px-1.5 py-1">
      <Filter className="size-3 text-muted-foreground" />
      {(["all", "success", "failed"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors md:text-[11px]",
            value === s
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s === "all" ? "Tous" : s === "success" ? "Succès" : "Échecs"}
        </button>
      ))}
    </div>
  );
}
