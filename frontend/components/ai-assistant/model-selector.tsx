//frontend\components\ai-assistant\model-selector.tsx
import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Cpu, Key, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_BRANDS,
  AiBrand,
  AiBrandInfo,
  DEFAULT_MODEL_CONFIG,
  MODEL_STORAGE_KEY,
  ModelConfig,
  SelectionType,
  brandsForRole,
  getBrand,
  isModelConfig,
} from "./model-selector-types";
import { getProviderLogo } from "./provider-logos";

const CONFIG_CHANGED_EVENT = "lc:model-config-changed";

export function useModelSelector() {
  const [selectedConfig, setSelectedConfig] = useState<ModelConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_CONFIG;
    try {
      const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
      if (!saved) return DEFAULT_MODEL_CONFIG;
      const parsed = JSON.parse(saved);
      return isModelConfig(parsed) ? parsed : DEFAULT_MODEL_CONFIG;
    } catch {
      return DEFAULT_MODEL_CONFIG;
    }
  });

  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<ModelConfig>).detail;
      if (detail && isModelConfig(detail)) setSelectedConfig(detail);
    };
    window.addEventListener(CONFIG_CHANGED_EVENT, onSync);
    return () => window.removeEventListener(CONFIG_CHANGED_EVENT, onSync);
  }, []);

  const updateSelection = (newConfig: ModelConfig) => {
    setSelectedConfig(newConfig);
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(newConfig));
      window.dispatchEvent(
        new CustomEvent<ModelConfig>(CONFIG_CHANGED_EVENT, { detail: newConfig }),
      );
    } catch (e) {
      console.error("Failed to save model config to localStorage", e);
    }
  };

  return { selectedConfig, updateSelection };
}

interface ModelSelectorProps {
  selectedConfig: ModelConfig;
  onConfigChange: (config: ModelConfig) => void;
  className?: string;
}

function BrandLogo({ brand, size = 16 }: { brand: AiBrandInfo; size?: number }) {
  const Logo = getProviderLogo(brand.providerLabel);
  if (!Logo) {
    return <Cpu className="text-muted-foreground" style={{ width: size, height: size }} />;
  }
  return <Logo size={size} />;
}

function RolePicker({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: AiBrandInfo[];
  value: AiBrand;
  onChange: (id: AiBrand) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.id === value) ?? options[0];
  if (!current) return null;

  return (
    <div ref={ref}>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="relative mt-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs transition-colors hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary",
            open && "border-primary/50 ring-1 ring-primary/20",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              <BrandLogo brand={current} size={14} />
            </span>
            <span className="truncate text-[12px] font-medium">{current.name}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-[70] mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-xl backdrop-blur-md transition-all duration-150 ease-out",
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-95 opacity-0",
          )}
        >
          {options.map((opt) => {
            const isSel = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSel}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                  isSel ? "bg-primary/10 text-primary" : "hover:bg-secondary/60 text-foreground",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0">
                    <BrandLogo brand={opt} size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium leading-tight">
                      {opt.name}
                    </span>
                    <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">
                      {opt.description}
                    </span>
                  </span>
                </span>
                {isSel && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ModelSelector({
  selectedConfig,
  onConfigChange,
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const research = getBrand(selectedConfig.team.research);
  const work = getBrand(selectedConfig.team.work);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const setMode = (mode: SelectionType) => {
    const researchOptions = brandsForRole("research", mode);
    const workOptions = brandsForRole("work", mode);
    const nextResearch = researchOptions.some((b) => b.id === selectedConfig.team.research)
      ? selectedConfig.team.research
      : researchOptions[0]!.id;
    const nextWork = workOptions.some((b) => b.id === selectedConfig.team.work)
      ? selectedConfig.team.work
      : workOptions[0]!.id;
    onConfigChange({
      ...selectedConfig,
      type: mode,
      team: { research: nextResearch, work: nextWork },
    });
  };

  const setResearch = (id: AiBrand) =>
    onConfigChange({
      ...selectedConfig,
      team: { ...selectedConfig.team, research: id },
    });
  const setWork = (id: AiBrand) =>
    onConfigChange({
      ...selectedConfig,
      team: { ...selectedConfig.team, work: id },
    });

  const mode = selectedConfig.type;
  const researchOptions = brandsForRole("research", mode);
  const workOptions = brandsForRole("work", mode);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex shrink-0 items-center gap-1">
            <BrandLogo brand={research} size={16} />
            <span className="text-[10px] text-muted-foreground/60">+</span>
            <BrandLogo brand={work} size={16} />
          </span>
          <div className="min-w-0 truncate">
            <span className="block truncate text-[12.5px] font-medium leading-tight">
              {research.name} + {work.name}
            </span>
            <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">
              {research.providerLabel} · {work.providerLabel}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border bg-popover p-3 shadow-xl backdrop-blur-md">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setMode("app")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-all",
                  mode === "app"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Cpu className="h-3.5 w-3.5" />
                Modèles inclus
              </button>
              <button
                type="button"
                onClick={() => setMode("user-key")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-all",
                  mode === "user-key"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Key className="h-3.5 w-3.5" />
                Ma clé API
              </button>
            </div>

            {mode === "user-key" && (
              <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[10.5px] leading-snug text-amber-600 dark:text-amber-400">
                <SettingsIcon className="mt-px h-3 w-3 shrink-0" />
                <span>
                  Gérez vos clés dans <b>Réglages → Clés API & équipes d’IA</b>.
                </span>
              </p>
            )}

            <div className="mt-3 space-y-3">
              <RolePicker
                label="IA de recherche"
                hint="Collecte, vérifie et synthétise les informations."
                options={researchOptions}
                value={selectedConfig.team.research}
                onChange={setResearch}
              />
              <RolePicker
                label="IA de travail"
                hint="Analyse, rédige et structure les livrables."
                options={workOptions}
                value={selectedConfig.team.work}
                onChange={setWork}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
