// frontend/components/settings/panels/CapabilitiesPanel.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  ChevronRight,
  Globe2,
  KeyRound,
  LockKeyhole,
  Plus,
  Search,
  Sparkles,
  UsersRound,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core/utils";
import {
  AI_BRANDS,
  AiBrand,
  AiBrandInfo,
  SelectionType,
  TeamConfig,
  brandsForRole,
  getBrand,
} from "@/components/ai-assistant/model-selector-types";
import { useModelSelector } from "@/components/ai-assistant/model-selector";
import { BrandLogo, ProviderLogo } from "@/components/ai-assistant/provider-logos";
import { useApiKeys } from "@/hooks/use-api-keys";
import { LoadingButton } from "../loading-button";
import { ApiKeysPanel } from "./ApiKeysPanel";
import { KnowledgeLibraryDialog } from "./KnowledgeLibraryDialog";
import { PanelIntro, PanelGroup, SettingsCard, SELECT_Z, fakeRequest } from "./primitives";

type CapabilitiesView = "overview" | "api";

function RoleField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint: string;
  value: AiBrand;
  onChange: (id: AiBrand) => void;
  options: AiBrand[];
}) {
  return (
    <div className="rounded-lg border border-border p-3 transition-colors">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
          <BrandLogo brand={value} size={16} />
        </span>
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as AiBrand)}>
        <SelectTrigger className="border-border bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
          {options.map((id) => {
            const brand = getBrand(id);
            return (
              <SelectItem key={id} value={id}>
                <span className="flex items-center gap-2">
                  <BrandLogo brand={brand} size={16} />
                  {brand.name}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function IncludedModelCard({ brand }: { brand: AiBrandInfo }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/30 p-3.5 transition-colors">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <BrandLogo brand={brand} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{brand.name}</p>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
            Inclus
          </span>
        </div>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
          par
          <ProviderLogo provider={brand.providerKey} size={11} />
          {brand.providerLabel}
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{brand.description}</p>
      </div>
    </div>
  );
}

function ApiAccessCard({ onOpen, onAdd }: { onOpen: () => void; onAdd: () => void }) {
  const { liveKeys, activeCount, pausedCount, usableProviders } = useApiKeys();
  const providers = Array.from(new Set(liveKeys.map((k) => k.provider)));
  const optional = AI_BRANDS.filter((b) => !b.included);
  const hasKeys = liveKeys.length > 0;

  return (
    <div className="rounded-xl border border-border bg-background p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="size-5" strokeWidth={1.7} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">Mes clés API</p>
            {activeCount > 0 && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                {activeCount} active{activeCount > 1 ? "s" : ""}
              </span>
            )}
            {pausedCount > 0 && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
                {pausedCount} en pause
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {hasKeys
              ? "Gérez vos clés : pause, remplacement et révocation en un clic."
              : "Branchez votre propre compte pour débloquer d'autres modèles."}
          </p>
        </div>

        {providers.length > 0 && (
          <span className="hidden -space-x-1.5 sm:flex">
            {providers.slice(0, 4).map((p) => (
              <span
                key={p}
                className="grid size-7 place-items-center rounded-full border border-border bg-background text-foreground"
              >
                <ProviderLogo provider={p} size={13} />
              </span>
            ))}
          </span>
        )}

        {hasKeys ? (
          <Button variant="outline" size="sm" onClick={onOpen}>
            Gérer <ChevronRight />
          </Button>
        ) : (
          <Button size="sm" onClick={onAdd}>
            <Plus /> Ajouter une clé
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
        <span className="text-xs font-medium text-muted-foreground">
          Modèles en plus avec votre clé
        </span>
        {optional.map((b) => {
          const unlocked = usableProviders.has(b.providerKey);
          return (
            <span
              key={b.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                unlocked
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-surface/40 text-muted-foreground",
              )}
            >
              <BrandLogo brand={b} size={12} />
              {b.name}
              {unlocked ? <Check className="size-3" /> : <LockKeyhole className="size-3" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TeamContent({ onOpenApi }: { onOpenApi: (add: boolean) => void }) {
  const { selectedConfig, updateSelection } = useModelSelector();
  const { hasUsableKey, usableProviders } = useApiKeys();

  const [savingTeam, setSavingTeam] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const mode: SelectionType = selectedConfig.type;
  const providerSig = useMemo(
    () => Array.from(usableProviders).sort().join(","),
    [usableProviders],
  );

  const poolFor = (role: "research" | "work", forMode: SelectionType) =>
    brandsForRole(role, forMode).filter((b) =>
      forMode === "app" ? b.included : usableProviders.has(b.providerKey),
    );

  const pickOrFirst = (pool: AiBrandInfo[], current: AiBrand) =>
    pool.some((b) => b.id === current) ? current : pool[0]!.id;

  const switchTo = (next: SelectionType) => {
    const researchPool = poolFor("research", next);
    const workPool = poolFor("work", next);
    if (researchPool.length === 0 || workPool.length === 0) return false;
    updateSelection({
      ...selectedConfig,
      type: next,
      team: {
        research: pickOrFirst(researchPool, selectedConfig.team.research),
        work: pickOrFirst(workPool, selectedConfig.team.work),
      },
    });
    return true;
  };

  const setMode = (next: SelectionType) => {
    if (next === mode) return;
    if (next === "user-key" && !hasUsableKey) {
      toast.info("Ajoutez d'abord une clé API pour utiliser vos propres modèles.");
      onOpenApi(true);
      return;
    }
    if (!switchTo(next)) {
      toast.error(
        next === "user-key"
          ? "Aucun modèle compatible avec vos clés API."
          : "Aucun modèle inclus disponible.",
      );
    }
  };

  useEffect(() => {
    if (mode !== "user-key") return;
    const researchPool = poolFor("research", "user-key");
    const workPool = poolFor("work", "user-key");

    if (!hasUsableKey || researchPool.length === 0 || workPool.length === 0) {
      switchTo("app");
      return;
    }
    const research = pickOrFirst(researchPool, selectedConfig.team.research);
    const work = pickOrFirst(workPool, selectedConfig.team.work);
    if (research !== selectedConfig.team.research || work !== selectedConfig.team.work) {
      updateSelection({ ...selectedConfig, team: { research, work } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, providerSig, hasUsableKey, selectedConfig.team.research, selectedConfig.team.work]);

  const setTeam = (partial: Partial<TeamConfig>) => {
    updateSelection({ ...selectedConfig, team: { ...selectedConfig.team, ...partial } });
  };

  const saveTeam = async () => {
    setSavingTeam(true);
    const t = toast.loading("Enregistrement de l'équipe…");
    await fakeRequest(600);
    toast.dismiss(t);
    setSavingTeam(false);
    toast.success("Équipe enregistrée");
  };

  const researchOptions = poolFor("research", mode);
  const workOptions = poolFor("work", mode);
  const research = getBrand(selectedConfig.team.research);
  const work = getBrand(selectedConfig.team.work);

  return (
    <>
      <SettingsCard
        title="Source & rôles"
        description="Choisissez la source des modèles puis une IA par rôle."
      >
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("app")}
            aria-pressed={mode === "app"}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mode === "app"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Modèles inclus
          </button>
          <button
            type="button"
            onClick={() => setMode("user-key")}
            aria-pressed={mode === "user-key"}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mode === "user-key"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground",
              !hasUsableKey && "text-muted-foreground/60",
            )}
          >
            Mes clés API
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <RoleField
            label="IA de recherche"
            hint="Collecte, vérifie et synthétise."
            value={selectedConfig.team.research}
            onChange={(id) => setTeam({ research: id })}
            options={researchOptions.map((b) => b.id)}
          />
          <RoleField
            label="IA de travail"
            hint="Analyse, rédige et structure."
            value={selectedConfig.team.work}
            onChange={(id) => setTeam({ work: id })}
            options={workOptions.map((b) => b.id)}
          />
        </div>

        {mode === "user-key" && !hasUsableKey && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            <LockKeyhole className="mt-px size-3.5 shrink-0" />
            <span>Ajoutez au moins une clé API active pour activer ce mode.</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            <b>Perplexity</b> n'est proposé qu'en recherche.
          </p>
          <LoadingButton
            size="sm"
            loading={savingTeam}
            loadingText="Enregistrement…"
            onClick={() => void saveTeam()}
          >
            Enregistrer l'équipe
          </LoadingButton>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Équipe active"
        description="Résumé des modèles actuellement utilisés."
      >
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-surface/50 px-3 py-2.5">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="size-3.5 text-primary" /> Recherche
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <BrandLogo brand={research} size={14} />
              {research.name}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface/50 px-3 py-2.5">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Travail
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <BrandLogo brand={work} size={14} />
              {work.name}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <label
            htmlFor="team-system-prompt"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="size-3 text-primary" />
            Instructions permanentes
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium">Contexte réutilisable</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Ajoutez des fichiers de référence transmis automatiquement à l’assistant.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
              <BookOpen className="mr-1.5 size-3.5" />
              Ouvrir la bibliothèque
            </Button>
          </div>
        </div>
      </SettingsCard>

      <KnowledgeLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} />
    </>
  );
}

function DomainsBlock() {
  return (
    <SettingsCard
      title="Domaines d'envoi"
      description="SPF, DKIM et DMARC sont contrôlés automatiquement."
      actions={
        <Button size="sm" variant="outline">
          <Plus /> Ajouter
        </Button>
      }
    >
      <div className="space-y-2">
        {["outbound.founder.co", "hi.founder.co"].map((domain) => (
          <div
            key={domain}
            className="flex items-center justify-between rounded-lg border border-border p-3.5 transition-colors"
          >
            <div>
              <p className="font-mono text-xs">{domain}</p>
              <p className="mt-1 text-xs text-muted-foreground">Warmup 87% · Score 9.2</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <Check className="size-3" /> Vérifié
            </span>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

export function CapabilitiesPanel() {
  const [view, setView] = useState<CapabilitiesView>("overview");
  const topRef = useRef<HTMLDivElement>(null);

  // Le formulaire d'ajout ne s'ouvre jamais tout seul : il faut cliquer sur le bouton.
  const openApi = () => setView("api");
  const backToOverview = () => setView("overview");

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ block: "start" });
  }, [view]);

  return (
    <div ref={topRef} className="scroll-mt-4">
      {view === "api" ? (
        <ApiKeysPanel onBack={backToOverview} />
      ) : (
        <OverviewView onOpenApi={openApi} />
      )}
    </div>
  );
}

function OverviewView({ onOpenApi }: { onOpenApi: (add: boolean) => void }) {
  return (
    <div className="space-y-8 md:space-y-12">
      <PanelIntro
        title="Capacités"
        description="Les modèles d'IA que vous utilisez, vos clés API et vos domaines d'envoi."
      />

      <PanelGroup
        label="Modèles inclus"
        description="Disponibles immédiatement, sans clé ni configuration."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AI_BRANDS.filter((b) => b.included).map((brand) => (
            <IncludedModelCard key={brand.id} brand={brand} />
          ))}
        </div>
      </PanelGroup>

      <PanelGroup
        label="Accès API personnel"
        description="Votre propre compte fournisseur, géré depuis une page dédiée."
      >
        <ApiAccessCard onOpen={() => onOpenApi(false)} onAdd={() => onOpenApi(true)} />
      </PanelGroup>

      <PanelGroup label="Composition de l'équipe">
        <TeamContent onOpenApi={onOpenApi} />
      </PanelGroup>

      <DomainsBlock />
    </div>
  );
}
