// frontend/components/settings/panels/ApiKeyDialog.tsx

import { useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, LockKeyhole } from "@/components/icons";
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
import {
  PROVIDER_CONSOLES,
  brandsForProvider,
  getProviderLabel,
  type ApiProvider,
  type StoredApiKey,
} from "@/components/ai-assistant/model-selector-types";
import { ProviderLogo } from "@/components/ai-assistant/provider-logos";
import { LoadingButton } from "../loading-button";
import { Field, SELECT_Z, fakeRequest, inputCls } from "./primitives";

export const PROVIDER_ORDER: ApiProvider[] = [
  "anthropic",
  "openai",
  "google",
  "perplexity",
  "deepseek",
  "mistral",
  "groq",
];

const MIN_KEY_LENGTH = 12;

export type ApiKeyDialogSubmit = {
  provider: ApiProvider;
  apiKey: string;
  label?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "replace";
  target?: StoredApiKey | null;
  onSubmit: (value: ApiKeyDialogSubmit) => void | Promise<void>;
};

export function ApiKeyDialog({ open, onOpenChange, mode, target, onSubmit }: Props) {
  const [provider, setProvider] = useState<ApiProvider>("anthropic");
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProvider(mode === "replace" && target ? target.provider : "anthropic");
    setLabel(mode === "replace" && target?.label ? target.label : "");
    setSecret("");
    setReveal(false);
    setError(undefined);
    setSubmitting(false);
  }, [open, mode, target]);

  const console_ = PROVIDER_CONSOLES[provider];
  const unlocked = brandsForProvider(provider);

  const submit = async () => {
    const value = secret.trim();
    if (value.length < MIN_KEY_LENGTH) {
      setError("Cette clé semble trop courte. Collez-la en entier.");
      return;
    }
    setSubmitting(true);
    await fakeRequest(400);
    await onSubmit({ provider, apiKey: value, label: label.trim() || undefined });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[70]">
        <DialogHeader>
          <DialogTitle>
            {mode === "replace" ? "Remplacer la clé" : "Ajouter une clé API"}
          </DialogTitle>
          <DialogDescription>
            {mode === "replace"
              ? "L'ancienne clé est effacée de ce navigateur dès l'enregistrement."
              : "Collez la clé d'un fournisseur pour utiliser ses modèles avec votre propre compte."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Fournisseur">
            {mode === "replace" ? (
              <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 text-sm">
                <ProviderLogo provider={provider} size={16} />
                {getProviderLabel(provider)}
              </div>
            ) : (
              <Select value={provider} onValueChange={(v) => setProvider(v as ApiProvider)}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {PROVIDER_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <ProviderLogo provider={p} size={16} />
                        {getProviderLabel(p)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          {unlocked.length > 0 && (
            <p className="-mt-1 text-[11px] text-muted-foreground">
              Débloque :{" "}
              <b className="font-medium text-foreground">
                {unlocked.map((b) => b.name).join(", ")}
              </b>
            </p>
          )}

          <Field label="Nom (optionnel)">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Production, Prospection FR…"
              maxLength={40}
              className={inputCls}
            />
          </Field>

          <Field label="Clé API" error={error}>
            <span className="relative block">
              <input
                type={reveal ? "text" : "password"}
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  if (error) setError(undefined);
                }}
                placeholder={console_.placeholder}
                autoComplete="off"
                spellCheck={false}
                className={`${inputCls} pr-10 font-mono`}
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? "Masquer la clé" : "Afficher la clé"}
                className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </Field>

          <div className="flex items-start gap-2 rounded-lg bg-surface/50 p-3 text-[11px] leading-snug text-muted-foreground">
            <LockKeyhole className="mt-px size-3.5 shrink-0 text-primary" />
            <span>
              La clé est stockée uniquement dans ce navigateur et n'est jamais affichée en entier.{" "}
              <a
                href={console_.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Où la trouver ? {console_.label}
                <ExternalLink className="size-3" />
              </a>
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <LoadingButton
            loading={submitting}
            loadingText="Enregistrement…"
            onClick={() => void submit()}
            disabled={!secret.trim()}
          >
            {mode === "replace" ? "Remplacer la clé" : "Ajouter la clé"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
