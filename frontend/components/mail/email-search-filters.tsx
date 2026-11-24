// frontend/components/mail/email-search-filters.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleDot,
  Filter,
  Paperclip,
  Star,
  X,
} from "@/components/icons";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/core/utils";
import {
  hasActiveFilters,
  type EmailLabel,
  type FolderKey,
  type SearchFilters,
} from "@shared/types/email-types";
import { LabelChip } from "./email-labels";

const FOLDERS: { key: FolderKey; label: string }[] = [
  { key: "inbox", label: "Réception" },
  { key: "starred", label: "Favoris" },
  { key: "sent", label: "Envoyés" },
  { key: "drafts", label: "Brouillons" },
  { key: "archive", label: "Archives" },
  { key: "spam", label: "Indésirables" },
  { key: "trash", label: "Corbeille" },
];

export function SearchBar({
  value,
  onChange,
  onOpenAdvanced,
  activeFilters,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onOpenAdvanced: () => void;
  activeFilters: SearchFilters;
  className?: string;
}) {
  const hasAdvanced = useMemo(() => {
    const { query: _q, ...rest } = activeFilters;
    return Object.values(rest).some((v) => Boolean(v) || (Array.isArray(v) && v.length > 0));
  }, [activeFilters]);

  return (
    <div className={cn("relative flex min-w-0 flex-1 items-center gap-1.5", className)}>
      <div className="relative min-w-0 flex-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher…"
          className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Effacer"
            className="absolute right-2 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenAdvanced}
        aria-label="Filtres avancés"
        className={cn(
          "relative grid size-8 shrink-0 place-items-center rounded-lg border text-muted-foreground transition-colors",
          hasAdvanced
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border hover:bg-secondary hover:text-foreground",
        )}
      >
        <Filter className="size-3.5" strokeWidth={1.8} />
        {hasAdvanced && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
        )}
      </button>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-3" strokeWidth={1.8} />
      {children}
    </button>
  );
}

export function QuickFilterChips({
  filters,
  onChange,
  className,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <ToggleChip
        active={Boolean(filters.isUnread)}
        onClick={() => onChange({ ...filters, isUnread: !filters.isUnread })}
        icon={CircleDot}
      >
        Non lus
      </ToggleChip>
      <ToggleChip
        active={Boolean(filters.isStarred)}
        onClick={() => onChange({ ...filters, isStarred: !filters.isStarred })}
        icon={Star}
      >
        Favoris
      </ToggleChip>
      <ToggleChip
        active={Boolean(filters.hasAttachment)}
        onClick={() => onChange({ ...filters, hasAttachment: !filters.hasAttachment })}
        icon={Paperclip}
      >
        Pièces jointes
      </ToggleChip>
      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange({ query: filters.query })}
          className="ml-1 inline-flex items-center gap-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3" strokeWidth={2} />
          Réinitialiser
        </button>
      )}
    </div>
  );
}

export function AdvancedFiltersPopover({
  open,
  onOpenChange,
  filters,
  onChange,
  labels,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  labels: EmailLabel[];
}) {
  const [local, setLocal] = useState<SearchFilters>(filters);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => firstInputRef.current?.focus());
  }, [open]);

  const apply = () => {
    onChange(local);
    onOpenChange(false);
  };

  const reset = () => setLocal({ query: filters.query });

  const set = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) =>
    setLocal((prev) => ({ ...prev, [k]: v }));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <span className="sr-only" aria-hidden />
      <PopoverContent align="end" sideOffset={6} className="w-[340px] p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Filtres avancés
          </p>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="De">
              <input
                ref={firstInputRef}
                value={local.from ?? ""}
                onChange={(e) => set("from", e.target.value)}
                placeholder="nom@exemple.com"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="À">
              <input
                value={local.to ?? ""}
                onChange={(e) => set("to", e.target.value)}
                placeholder="destinataire@…"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>

          <Field label="Objet">
            <input
              value={local.subject ?? ""}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Contient…"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Dossier">
            <select
              value={local.folder ?? ""}
              onChange={(e) =>
                set("folder", (e.target.value || undefined) as FolderKey | undefined)
              }
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous</option>
              {FOLDERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Période">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={local.dateFrom ?? ""}
                onChange={(e) => set("dateFrom", e.target.value || undefined)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="date"
                value={local.dateTo ?? ""}
                onChange={(e) => set("dateTo", e.target.value || undefined)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </Field>

          <Field label="Labels">
            <div className="flex flex-wrap gap-1">
              {labels.length === 0 && (
                <span className="text-[10.5px] text-muted-foreground">Aucun label disponible</span>
              )}
              {labels.map((l) => {
                const active = local.labels?.includes(l.id) ?? false;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      const set_ = new Set(local.labels ?? []);
                      active ? set_.delete(l.id) : set_.add(l.id);
                      const next = Array.from(set_);
                      set("labels", next.length === 0 ? undefined : next);
                    }}
                  >
                    <LabelChip label={l} size="sm" />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Statut">
            <div className="flex flex-wrap gap-1.5">
              <ToggleChip
                active={Boolean(local.isUnread)}
                onClick={() => set("isUnread", !local.isUnread)}
                icon={CircleDot}
              >
                Non lus
              </ToggleChip>
              <ToggleChip
                active={Boolean(local.isStarred)}
                onClick={() => set("isStarred", !local.isStarred)}
                icon={Star}
              >
                Favoris
              </ToggleChip>
              <ToggleChip
                active={Boolean(local.hasAttachment)}
                onClick={() => set("hasAttachment", !local.hasAttachment)}
                icon={Paperclip}
              >
                PJ
              </ToggleChip>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={reset}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-opacity hover:opacity-90"
          >
            Appliquer
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
