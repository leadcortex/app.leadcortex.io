// frontend/routes/app/enrichment/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Plus,
  RefreshCw,
  Wand2,

} from "@/components/icons";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import { EnrichmentSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { cn } from "@/lib/core/utils";

import {
  DEFAULT_CREDITS_TOTAL,
  DEFAULT_CREDITS_USED,
  DEFAULT_PROVIDERS,
  type EnrichmentJob,
  type EnrichmentProvider,
} from "@/lib/enrichment/mock";
import { aggregateCoverage, aggregateKpis } from "@/lib/enrichment/metrics";
import {
  fetchJobs,
  fetchProviders,
  fetchWallet,
  rechargeCreditsApi,
  reorderProvidersApi,
  updateProviderApi,
} from "@/lib/enrichment/api";

import { WaterfallFlow } from "@/components/enrichment/waterfall-flow";
import { ProviderCard, ProviderDiscoveryCard } from "@/components/enrichment/provider-card";
import { FieldCoverage } from "@/components/enrichment/field-coverage";
import { EnrichmentLog } from "@/components/enrichment/enrichment-log";
import { CreditsWallet } from "@/components/enrichment/credits-wallet";
import { ProviderActivateDialog } from "@/components/enrichment/provider-activate-dialog";

export const Route = createFileRoute("/app/enrichment/")({
  head: () => ({
    meta: [
      { title: "Enrichissement · LeadCortex" },
      {
        name: "description",
        content:
          "Enrichissement en cascade avec Apollo, Hunter, Dropcontact et Kaspr. Un crédit n'est débité que si une source trouve.",
      },
      { property: "og:title", content: "Enrichissement · LeadCortex" },
      {
        property: "og:description",
        content: "Vous ne payez que les données trouvées.",
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
        toast.error("Impossible de charger les sources");
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
          nextStatus === "connected" ? `${current.name} activée` : `${current.name} en pause`,
        );
      } catch {
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
      setProviders((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status: "connected" } : p)),
      );

      try {
        await Promise.all(ids.map((id) => updateProviderApi(id, { status: "connected" })));
        await reorderProvidersApi(providers.map((p) => p.id));
        toast.success(
          `${ids.length} source${ids.length > 1 ? "s" : ""} activée${ids.length > 1 ? "s" : ""}`,
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
      await updateProviderApi(provider.id, { status: "available" });
      toast.success(`${provider.name} retirée`);
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

  const statsLine = `${kpis.matchRate.toFixed(0)} % des recherches aboutissent · ${kpis.totalCredits.toLocaleString("fr-FR")} crédits utilisés sur ${range}`;

  if (!hasAnyActive) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-10">
        <Header onActivate={() => setActivateOpen(true)} hasProviders={providers.length > 0} />

        <EmptyState
          icon={Wand2}
          title="Aucune source activée"
          description="Activez une source pour trouver les e-mails, téléphones et profils LinkedIn de vos prospects."
          action={{
            label: "Activer une source",
            onClick: () => setActivateOpen(true),
            icon: Plus,
          }}
        />

        {available.length > 0 && (
          <section className="mt-8 md:mt-12">
            <h2 className="mb-4 text-base font-semibold">Sources disponibles</h2>
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

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <Header onActivate={() => setActivateOpen(true)} hasProviders description={statsLine} />

      <div className="space-y-8 md:space-y-12">
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Ordre des sources</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Si une source ne trouve rien, la suivante prend le relais.
              </p>
            </div>
            <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums md:inline">
              {connected.length} active{connected.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <WaterfallFlow providers={providers} onToggle={(id) => void toggleProvider(id)} />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Cliquez sur une source pour l'activer ou la mettre en pause.
          </p>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold">Couverture par champ</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Ce que vos sources actives peuvent trouver au mieux.
            </p>
          </div>
          <FieldCoverage providers={providers} coverage={coverage} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Sources actives</h2>
            <Button variant="outline" size="sm" onClick={() => setActivateOpen(true)}>
              <Plus /> Ajouter
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {connected.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onToggle={() => void toggleProvider(p.id)}
                onConfigure={() => toast.info(`Réglages de ${p.name} bientôt disponibles`)}
                onRemove={() => setConfirmRemove(p)}
              />
            ))}
          </div>
        </section>

        {available.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold">Sources disponibles</h2>
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Historique</h2>
              <div className="flex items-center gap-2">
                <RangeToggle value={range} onChange={setRange} />
                <StatusFilter value={statusFilter} onChange={setStatusFilter} />
              </div>
            </div>
            {loadingJobs ? (
              <div className="flex items-center gap-2 rounded-xl border border-border p-6 text-[13px] text-muted-foreground">
                <RefreshCw className="size-4 animate-spin" /> Chargement…
              </div>
            ) : (
              <EnrichmentLog jobs={jobs} />
            )}
          </section>

          <aside className="space-y-6">
            <CreditsWallet total={wallet.total} used={wallet.used} onRecharge={recharge} />

            <div className="border-t border-border pt-6">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {connected.length >= 3
                  ? `Vos ${connected.length} sources trouvent ${coverage.email} % des e-mails. Kaspr ajouterait surtout des numéros de mobile.`
                  : "Une deuxième source trouve souvent ce que la première a manqué, sans coût sur les prospects déjà enrichis."}
              </p>
              <button
                type="button"
                onClick={() => setActivateOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
              >
                Voir les sources <ArrowRight className="size-3.5" />
              </button>
            </div>
          </aside>
        </div>
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
        title={`Retirer ${confirmRemove?.name ?? ""} ?`}
        description="Vous pourrez la réactiver plus tard depuis les sources disponibles."
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}

function Header({
  onActivate,
  hasProviders,
  description = "Les sources sont interrogées dans l'ordre. Un crédit n'est débité que si l'une d'elles trouve.",
}: {
  onActivate: () => void;
  hasProviders: boolean;
  description?: string;
}) {
  return (
    <PageHeader
      eyebrow="Enrichissement"
      title="Vos sources de données."
      description={description}
      actions={
        <Button onClick={onActivate}>
          <Plus />
          {hasProviders ? "Ajouter une source" : "Activer une source"}
        </Button>
      }
    />
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
            "rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
            value === o
              ? "bg-background text-foreground"
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
    <div className="inline-flex items-center rounded-lg border border-border bg-surface/40 p-0.5">
      {(["all", "success", "failed"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === s
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s === "all" ? "Tous" : s === "success" ? "Succès" : "Échecs"}
        </button>
      ))}
    </div>
  );
}
