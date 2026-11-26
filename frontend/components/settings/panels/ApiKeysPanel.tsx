// frontend/components/settings/panels/ApiKeysPanel.tsx

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  History,
  KeyRound,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { cn } from "@/lib/core/utils";
import {
  AI_BRANDS,
  PROVIDER_CONSOLES,
  brandsForProvider,
  getKeyStatus,
  getProviderLabel,
  keyLast4,
  type ApiProvider,
  type StoredApiKey,
} from "@/components/ai-assistant/model-selector-types";
import { BrandLogo, ProviderLogo } from "@/components/ai-assistant/provider-logos";
import { useApiKeys } from "@/hooks/use-api-keys";
import { ApiKeyDialog, PROVIDER_ORDER, type ApiKeyDialogSubmit } from "./ApiKeyDialog";
import { PanelIntro } from "./primitives";

const API_ILLUSTRATION = "/images/app/api-keys.svg";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(ts?: number) {
  return ts ? dateFmt.format(ts) : null;
}

function keyTitle(k: StoredApiKey) {
  return k.label?.trim() || getProviderLabel(k.provider);
}

function openConsole(provider: ApiProvider) {
  window.open(PROVIDER_CONSOLES[provider].url, "_blank", "noopener,noreferrer");
}

const glassCard = "rounded-xl border border-border bg-background/75 backdrop-blur-[3px]";

function ApiBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none sticky top-0 -z-10 h-0 select-none">
      <img
        src={API_ILLUSTRATION}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-[8vh] w-[min(560px,92%)] -translate-x-1/2 opacity-[0.32] dark:opacity-[0.22] dark:invert"
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-2 py-4 text-center md:py-8">
      <img
        src={API_ILLUSTRATION}
        alt="Illustration : un serveur, le cloud API et un ordinateur connectés entre eux"
        draggable={false}
        className="w-[min(520px,92%)] select-none"
      />
      <h3 className="mt-5 text-base font-semibold">Aucune clé API pour le moment</h3>
      <Button className="mt-5" onClick={onAdd}>
        <Plus /> Ajouter ma première clé
      </Button>

      <ul className="mt-7 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        {PROVIDER_ORDER.map((p) => (
          <li key={p} className="inline-flex items-center gap-1.5">
            <ProviderLogo provider={p} size={14} />
            {getProviderLabel(p)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "paused" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "active" ? "bg-success/10 text-success" : "bg-warning/15 text-warning",
      )}
    >
      {status === "active" ? "Active" : "En pause"}
    </span>
  );
}

function KeyCard({
  apiKey,
  onTogglePause,
  onReplace,
  onRevoke,
}: {
  apiKey: StoredApiKey;
  onTogglePause: () => void;
  onReplace: () => void;
  onRevoke: () => void;
}) {
  const status = getKeyStatus(apiKey) === "paused" ? "paused" : "active";
  const unlocked = brandsForProvider(apiKey.provider);
  const added = formatDate(apiKey.createdAt);
  const lastUsed = formatDate(apiKey.lastUsedAt);

  return (
    <li
      className={cn(
        glassCard,
        "flex flex-col gap-3 p-3.5 transition-colors sm:flex-row sm:items-center",
        status === "paused" && "opacity-80",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <ProviderLogo provider={apiKey.provider} size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{keyTitle(apiKey)}</p>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {getProviderLabel(apiKey.provider)} · •••• {keyLast4(apiKey)}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Débloque {unlocked.map((b) => b.name).join(", ")}
            {added && <> · Ajoutée le {added}</>}
            {lastUsed && <> · Utilisée le {lastUsed}</>}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end">
        <Button variant="ghost" size="sm" onClick={onTogglePause}>
          {status === "paused" ? <Play /> : <Pause />}
          {status === "paused" ? "Réactiver" : "Mettre en pause"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReplace}>
          <RefreshCw /> Remplacer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRevoke}
        >
          <Trash2 /> Révoquer
        </Button>
      </div>
    </li>
  );
}

export function ApiKeysPanel({ onBack }: { onBack: () => void }) {
  const {
    liveKeys,
    revokedKeys,
    activeCount,
    pausedCount,
    addKey,
    replaceKey,
    setStatus,
    revokeKey,
    revokeAll,
    forgetKey,
    clearHistory,
  } = useApiKeys();

  const [addOpen, setAddOpen] = useState(false);
  const [toReplace, setToReplace] = useState<StoredApiKey | null>(null);
  const [toRevoke, setToRevoke] = useState<StoredApiKey | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isEmpty = liveKeys.length === 0;
  const liveProviders = Array.from(new Set(liveKeys.map((k) => k.provider)));

  const handleAdd = (v: ApiKeyDialogSubmit) => {
    addKey(v);
    toast.success(`Clé ${getProviderLabel(v.provider)} ajoutée`);
  };

  const handleReplace = (v: ApiKeyDialogSubmit) => {
    if (!toReplace) return;
    replaceKey(toReplace.id, { apiKey: v.apiKey, label: v.label });
    toast.success("Clé remplacée", {
      description: "Pensez à supprimer l'ancienne clé dans la console du fournisseur.",
    });
  };

  const handleTogglePause = (k: StoredApiKey) => {
    const next = getKeyStatus(k) === "paused" ? "active" : "paused";
    setStatus(k.id, next);
    toast.success(next === "paused" ? "Clé mise en pause" : "Clé réactivée");
  };

  const confirmRevoke = () => {
    if (!toRevoke) return;
    const provider = toRevoke.provider;
    revokeKey(toRevoke.id);
    setToRevoke(null);
    toast.success(`Clé ${getProviderLabel(provider)} révoquée`, {
      description: "Supprimez-la aussi côté fournisseur pour l'invalider complètement.",
      action: { label: "Ouvrir la console", onClick: () => openConsole(provider) },
    });
  };

  const confirmRevokeAll = () => {
    revokeAll();
    setRevokeAllOpen(false);
    toast.success("Toutes les clés ont été révoquées");
  };

  const revokeDescription = toRevoke
    ? `La clé « ${keyTitle(toRevoke)} » (${getProviderLabel(toRevoke.provider)} •••• ${keyLast4(toRevoke)}) sera effacée de ce navigateur. ${brandsForProvider(
        toRevoke.provider,
      )
        .map((b) => b.name)
        .join(
          ", ",
        )} ne fonctionnera plus avec votre propre compte. Pour l'invalider chez le fournisseur, supprimez-la aussi dans sa console.`
    : "";

  return (
    <div className="relative isolate min-h-[min(68vh,560px)]">
      {!isEmpty && <ApiBackdrop />}

      <div className="relative space-y-7">
        <div className="space-y-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" /> Capacités
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <PanelIntro
                title="Mes clés API"
                description="Vos clés restent chiffrées. Vous pouvez les mettre en pause ou les révoquer à tout moment."
              />
            </div>
            {!isEmpty && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus /> Ajouter une clé
              </Button>
            )}
          </div>
        </div>

        {isEmpty ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Actives", value: activeCount, tone: "text-success" },
                { label: "En pause", value: pausedCount, tone: "text-warning" },
                { label: "Révoquées", value: revokedKeys.length, tone: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className={cn(glassCard, "px-3.5 py-3")}>
                  <p className={cn("text-xl font-semibold tabular-nums", s.tone)}>{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <section className="space-y-3">
              <div className="border-b border-border/50 pb-2">
                <h3 className="text-[11px] font-semibold">
                  Clés enregistrées
                </h3>
              </div>
              <ul className="space-y-2.5">
                {liveKeys.map((k) => (
                  <KeyCard
                    key={k.id}
                    apiKey={k}
                    onTogglePause={() => handleTogglePause(k)}
                    onReplace={() => setToReplace(k)}
                    onRevoke={() => setToRevoke(k)}
                  />
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <div className="border-b border-border/50 pb-2">
                <h3 className="text-[11px] font-semibold">
                  Révocation & sécurité
                </h3>
              </div>
              <div className={cn(glassCard, "space-y-4 p-4")}>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <b className="font-medium text-foreground">Révoquer</b> efface immédiatement la
                    clé de ce navigateur. Pour qu'elle soit aussi invalidée chez le fournisseur,
                    supprimez-la dans sa console :
                  </p>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {liveProviders.map((p) => (
                    <li key={p}>
                      <a
                        href={PROVIDER_CONSOLES[p].url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:text-primary"
                      >
                        <ProviderLogo provider={p} size={14} />
                        {PROVIDER_CONSOLES[p].label}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldAlert className="size-3.5 text-destructive" />
                    Une clé compromise ? Coupez tout d'un coup.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setRevokeAllOpen(true)}
                  >
                    <Trash2 /> Tout révoquer
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}

        {revokedKeys.length > 0 && (
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-expanded={historyOpen}
              className="flex w-full items-center justify-between gap-2 border-b border-border/50 pb-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold">
                <History className="size-3.5 text-muted-foreground" />
                Historique des révocations
                <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground">
                  {revokedKeys.length}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  historyOpen && "rotate-180",
                )}
              />
            </button>

            {historyOpen && (
              <div className="space-y-2.5">
                <ul className={cn(glassCard, "divide-y divide-border")}>
                  {revokedKeys.map((k) => (
                    <li key={k.id} className="flex items-center gap-3 p-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-muted-foreground">
                        <ProviderLogo provider={k.provider} size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{keyTitle(k)}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          •••• {keyLast4(k)}
                          {formatDate(k.revokedAt) && <> · Révoquée le {formatDate(k.revokedAt)}</>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          forgetKey(k.id);
                          toast.success("Retirée de l'historique");
                        }}
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      clearHistory();
                      setHistoryOpen(false);
                      toast.success("Historique vidé");
                    }}
                  >
                    Vider l'historique
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {!isEmpty && (
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-[11px] text-muted-foreground">
            {AI_BRANDS.map((b) => (
              <li key={b.id} className="inline-flex items-center gap-1.5">
                <BrandLogo brand={b.id} size={14} />
                {b.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ApiKeyDialog open={addOpen} onOpenChange={setAddOpen} mode="add" onSubmit={handleAdd} />

      <ApiKeyDialog
        open={!!toReplace}
        onOpenChange={(v) => !v && setToReplace(null)}
        mode="replace"
        target={toReplace}
        onSubmit={handleReplace}
      />

      <ConfirmDialog
        open={!!toRevoke}
        onOpenChange={(v) => !v && setToRevoke(null)}
        onConfirm={confirmRevoke}
        title={`Révoquer la clé ${toRevoke ? getProviderLabel(toRevoke.provider) : ""} ?`}
        description={revokeDescription}
        confirmLabel="Révoquer"
        cancelLabel="Annuler"
        variant="destructive"
      />

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        onConfirm={confirmRevokeAll}
        title="Révoquer toutes les clés ?"
        description="Toutes vos clés API seront effacées de ce navigateur et l'assistant repassera sur les modèles inclus. Pensez à les supprimer aussi dans les consoles des fournisseurs."
        confirmLabel="Tout révoquer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}
