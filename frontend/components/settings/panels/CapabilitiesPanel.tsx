//frontend\components\settings\panels\CapabilitiesPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Check,
  Globe2,
  KeyRound,
  LockKeyhole,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PROVIDER_ICONS } from "@/components/provider-icons";
import { cn } from "@/lib/utils";
import {
  AI_BRANDS,
  AiBrand,
  AiBrandInfo,
  ApiProvider,
  SelectionType,
  StoredApiKey,
  TeamConfig,
  brandsForRole,
  getBrand,
  getProviderLabel,
  loadApiKeys,
  saveApiKeys,
} from "@/components/ai-assistant/model-selector-types";
import { useModelSelector } from "@/components/ai-assistant/model-selector";
import { DeepSeekLogo } from "@/components/ai-assistant/provider-logos";
import { LoadingButton } from "../loading-button";
import {
  PanelIntro,
  PanelGroup,
  SettingsCard,
  SELECT_Z,
  fakeRequest,
  type Icon,
} from "./primitives";

const TEAM_SYSTEM_PROMPT_KEY = "lc.ai.team.systemPrompt";

const PROVIDER_ORDER: ApiProvider[] = [
  "anthropic",
  "openai",
  "google",
  "perplexity",
  "deepseek",
  "mistral",
  "groq",
];

const GeminiIcon: Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0C12.55 6.55 17.45 11.45 24 12C17.45 12.55 12.55 17.45 12 24C11.45 17.45 6.55 12.55 0 12C6.55 11.45 11.45 6.55 12 0Z" />
  </svg>
);
const DeepSeekSettingIcon: Icon = ({ className }) => <DeepSeekLogo className={className} />;

function getProviderIcon(label: string, fallback: Icon = Bot): Icon {
  const n = label.trim().toLowerCase();
  if (n === "gemini" || n === "google" || n.includes("gemini")) return GeminiIcon;
  if (n.includes("deepseek")) return DeepSeekSettingIcon;
  return (PROVIDER_ICONS[label] as Icon | undefined) ?? fallback;
}

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
  const current = getBrand(value);
  const Icon = getProviderIcon(current.providerLabel);
  return (
    <div className="rounded-lg border border-border p-3 transition-colors hover:border-primary/20">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as AiBrand)}>
        <SelectTrigger className="border-border bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
          {options.map((id) => {
            const brand = getBrand(id);
            const BrandIcon = getProviderIcon(brand.providerLabel);
            return (
              <SelectItem key={id} value={id}>
                <span className="flex items-center gap-2">
                  <BrandIcon className="size-4" />
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

function AiTeamsContent() {
  const { selectedConfig, updateSelection } = useModelSelector();
  const [keys, setKeys] = useState<StoredApiKey[]>(() => loadApiKeys());
  useEffect(() => saveApiKeys(keys), [keys]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftProvider, setDraftProvider] = useState<ApiProvider>("anthropic");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [addingKey, setAddingKey] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [toRemoveKey, setToRemoveKey] = useState<StoredApiKey | null>(null);

  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TEAM_SYSTEM_PROMPT_KEY) ?? "";
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(TEAM_SYSTEM_PROMPT_KEY, systemPrompt);
    } catch {
      /* Intentionally ignored. */
    }
  }, [systemPrompt]);

  const mode: SelectionType = selectedConfig.type;
  const hasKeys = keys.length > 0;
  const ownedProviders = useMemo(() => new Set(keys.map((k) => k.provider)), [keys]);

  const filterForMode = useMemo(
    () => (brands: AiBrandInfo[]) =>
      mode === "app"
        ? brands.filter((b) => b.included)
        : brands.filter((b) => ownedProviders.has(b.providerKey)),
    [mode, ownedProviders],
  );

  const setMode = (next: SelectionType) => {
    if (next === mode) return;
    if (next === "user-key" && !hasKeys) {
      toast.info("Ajoutez d'abord une clé API pour utiliser vos propres modèles.");
      setDialogOpen(true);
      return;
    }
    const researchPool = filterForMode(brandsForRole("research", next));
    const workPool = filterForMode(brandsForRole("work", next));
    if (researchPool.length === 0 || workPool.length === 0) {
      toast.error(
        next === "user-key"
          ? "Aucun modèle compatible avec vos clés API."
          : "Aucun modèle inclus disponible.",
      );
      return;
    }
    const nextResearch = researchPool.some((b) => b.id === selectedConfig.team.research)
      ? selectedConfig.team.research
      : researchPool[0]!.id;
    const nextWork = workPool.some((b) => b.id === selectedConfig.team.work)
      ? selectedConfig.team.work
      : workPool[0]!.id;
    updateSelection({
      ...selectedConfig,
      type: next,
      team: { research: nextResearch, work: nextWork },
    });
  };

  useEffect(() => {
    if (mode === "user-key" && !hasKeys) {
      const researchPool = brandsForRole("research", "app").filter((b) => b.included);
      const workPool = brandsForRole("work", "app").filter((b) => b.included);
      if (researchPool.length === 0 || workPool.length === 0) return;
      updateSelection({
        ...selectedConfig,
        type: "app",
        team: {
          research: researchPool.some((b) => b.id === selectedConfig.team.research)
            ? selectedConfig.team.research
            : researchPool[0]!.id,
          work: workPool.some((b) => b.id === selectedConfig.team.work)
            ? selectedConfig.team.work
            : workPool[0]!.id,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKeys, mode]);

  const setTeam = (partial: Partial<TeamConfig>) => {
    updateSelection({ ...selectedConfig, team: { ...selectedConfig.team, ...partial } });
  };

  const addKey = async () => {
    if (!draftKey.trim()) return;
    setAddingKey(true);
    await fakeRequest(400);
    setKeys((cur) => [
      ...cur,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        provider: draftProvider,
        apiKey: draftKey.trim(),
        label: draftLabel.trim() || undefined,
      },
    ]);
    setAddingKey(false);
    setDialogOpen(false);
    setDraftKey("");
    setDraftLabel("");
    toast.success(`Clé ${getProviderLabel(draftProvider)} ajoutée`);
  };

  const confirmRemoveKey = () => {
    if (!toRemoveKey) return;
    setKeys((cur) => cur.filter((k) => k.id !== toRemoveKey.id));
    toast.success("Clé supprimée");
    setToRemoveKey(null);
  };

  const saveTeam = async () => {
    setSavingTeam(true);
    const t = toast.loading("Enregistrement de l'équipe…");
    await fakeRequest(600);
    toast.dismiss(t);
    setSavingTeam(false);
    toast.success("Équipe enregistrée");
  };

  const researchOptions = filterForMode(brandsForRole("research", mode));
  const workOptions = filterForMode(brandsForRole("work", mode));
  const research = getBrand(selectedConfig.team.research);
  const work = getBrand(selectedConfig.team.work);

  return (
    <div className="space-y-8">
      <PanelGroup label="Modèles inclus">
        <SettingsCard
          title="Disponibles immédiatement"
          description="Ces modèles sont utilisables sans configuration."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AI_BRANDS.filter((b) => b.included).map((brand) => {
              const BrandIcon = getProviderIcon(brand.providerLabel);
              return (
                <div
                  key={brand.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface/30 p-3.5 transition-colors hover:border-primary/20"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BrandIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{brand.name}</p>
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                        Inclus
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {brand.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Clés API (BYOK)">
        <SettingsCard
          title="Vos clés API"
          description="Ajoutez une clé par fournisseur pour utiliser plus de modèles."
          actions={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus /> Ajouter
            </Button>
          }
        >
          {keys.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface/20 p-4 text-xs text-muted-foreground">
              <KeyRound className="size-4 text-primary" />
              <span>
                Aucune clé. Vous pouvez déjà utiliser les{" "}
                <b className="text-foreground">modèles inclus</b>.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {keys.map((key) => {
                const KeyIcon = getProviderIcon(getProviderLabel(key.provider), KeyRound);
                const last4 = key.apiKey.slice(-4);
                return (
                  <div key={key.id} className="flex items-center gap-3 p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface">
                      <KeyIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {getProviderLabel(key.provider)}
                        </p>
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-medium text-success">
                          Connectée
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {key.label ? `${key.label} · ` : ""}•••• {last4}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer la clé ${getProviderLabel(key.provider)}`}
                      onClick={() => setToRemoveKey(key)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Composition de l'équipe">
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
                "rounded-md px-3 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === "app"
                  ? "bg-background text-foreground shadow-sm"
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
                "rounded-md px-3 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === "user-key"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                !hasKeys && "text-muted-foreground/60",
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

          {mode === "user-key" && !hasKeys && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-[10.5px] text-warning">
              <LockKeyhole className="mt-px size-3.5 shrink-0" />
              <span>Ajoutez au moins une clé API pour activer ce mode.</span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[10.5px] text-muted-foreground">
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
          icon={UsersRound}
        >
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-surface/50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Search className="size-3.5 text-primary" /> Recherche
              </span>
              <span className="font-medium">{research.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface/50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" /> Travail
              </span>
              <span className="font-medium">{work.name}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <label
              htmlFor="team-system-prompt"
              className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              <Sparkles className="size-3 text-primary" />
              Instructions permanentes
            </label>
            <Textarea
              id="team-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Ex. : réponds toujours en français, ton direct…"
              className="mt-2 min-h-[88px] resize-y border-border bg-background text-xs leading-relaxed"
            />
          </div>
        </SettingsCard>
      </PanelGroup>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="z-[70]">
          <DialogHeader>
            <DialogTitle>Ajouter une clé API</DialogTitle>
            <DialogDescription>
              La clé est stockée localement dans votre navigateur.
            </DialogDescription>
          </DialogHeader>

          <label className="text-xs font-medium">
            Fournisseur
            <Select value={draftProvider} onValueChange={(v) => setDraftProvider(v as ApiProvider)}>
              <SelectTrigger className="mt-2 border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                {PROVIDER_ORDER.map((p) => {
                  const ProviderIcon = getProviderIcon(getProviderLabel(p));
                  return (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <ProviderIcon className="size-4" />
                        {getProviderLabel(p)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </label>

          <label className="text-xs font-medium">
            Nom (optionnel)
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="Production, Prospection FR…"
              className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="text-xs font-medium">
            Clé API
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="Collez votre clé"
              className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <LoadingButton
              loading={addingKey}
              loadingText="Ajout…"
              onClick={() => void addKey()}
              disabled={!draftKey.trim()}
            >
              Ajouter la clé
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toRemoveKey}
        onOpenChange={(v) => !v && setToRemoveKey(null)}
        onConfirm={confirmRemoveKey}
        title={`Supprimer la clé ${toRemoveKey ? getProviderLabel(toRemoveKey.provider) : ""} ?`}
        description="Vous ne pourrez plus utiliser les modèles associés à cette clé. Cette action est immédiate."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DomainsBlock                                                              */
/* -------------------------------------------------------------------------- */

function DomainsBlock() {
  return (
    <SettingsCard
      title="Domaines d'envoi"
      description="SPF, DKIM et DMARC sont contrôlés automatiquement."
      icon={Globe2}
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
            className="flex items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:border-primary/20"
          >
            <div>
              <p className="font-mono text-xs">{domain}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Warmup 87% · Score 9.2</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-success">
              <Check className="size-3" /> Vérifié
            </span>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  CapabilitiesPanel                                                         */
/* -------------------------------------------------------------------------- */

export function CapabilitiesPanel() {
  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Sparkles}
        title="Capacités"
        description="Choisissez les IA qui composent vos équipes et vérifiez vos domaines d'envoi."
      />
      <AiTeamsContent />
      <DomainsBlock />
    </div>
  );
}
