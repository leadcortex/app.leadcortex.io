// frontend/components/mail/email-labels.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, Tag, Trash2 } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import type { EmailLabel } from "@shared/types/email-types";

export const LABEL_COLORS: { id: string; value: string; name: string }[] = [
  { id: "primary", value: "var(--primary)", name: "Ambre" },
  { id: "success", value: "var(--success)", name: "Vert" },
  { id: "warning", value: "var(--warning)", name: "Or" },
  { id: "destructive", value: "var(--destructive)", name: "Rouge" },
  { id: "chart-1", value: "var(--chart-1)", name: "Terracotta" },
  { id: "chart-2", value: "var(--chart-2)", name: "Miel" },
  { id: "chart-3", value: "var(--chart-3)", name: "Eucalyptus" },
  { id: "chart-4", value: "var(--chart-4)", name: "Indigo" },
  { id: "chart-5", value: "var(--chart-5)", name: "Rose" },
];

export const DEFAULT_LABELS: EmailLabel[] = [
  { id: "label-important", name: "Important", color: "var(--destructive)" },
  { id: "label-client", name: "Client", color: "var(--primary)" },
  { id: "label-interne", name: "Interne", color: "var(--chart-4)" },
  { id: "label-a-faire", name: "À faire", color: "var(--warning)" },
];

export function LabelChip({
  label,
  onRemove,
  size = "md",
}: {
  label: EmailLabel;
  onRemove?: (id: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10.5px]",
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${label.color} 15%, transparent)`,
        borderColor: `color-mix(in oklab, ${label.color} 40%, transparent)`,
        color: `color-mix(in oklab, ${label.color} 85%, var(--foreground))`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: label.color }}
        aria-hidden
      />
      <span className="max-w-[100px] truncate">{label.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(label.id)}
          aria-label={`Retirer ${label.name}`}
          className="grid size-3 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function LabelChipRow({
  labels,
  onRemove,
  size = "sm",
  className,
}: {
  labels: EmailLabel[];
  onRemove?: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  if (labels.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {labels.map((l) => (
        <LabelChip key={l.id} label={l} onRemove={onRemove} size={size} />
      ))}
    </div>
  );
}

export function LabelPicker({
  labels,
  selectedIds,
  onToggle,
  onCreate,
  onManage,
  trigger,
}: {
  labels: EmailLabel[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onCreate?: (name: string, color: string) => void;
  onManage?: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return labels;
    return labels.filter((l) => l.name.toLowerCase().includes(query));
  }, [labels, q]);

  const exact = filtered.some((l) => l.name.toLowerCase() === q.trim().toLowerCase());
  const canCreate = q.trim().length > 0 && !exact && Boolean(onCreate);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un label…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ul className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && !canCreate && (
            <li className="px-3 py-4 text-center text-[11px] text-muted-foreground">
              Aucun label
            </li>
          )}
          {filtered.map((l) => {
            const active = selectedIds.includes(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onToggle(l.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    active ? "bg-secondary" : "hover:bg-secondary/60",
                  )}
                >
                  <span
                    className="size-3 shrink-0 rounded-full border"
                    style={{
                      backgroundColor: l.color,
                      borderColor: `color-mix(in oklab, ${l.color} 40%, transparent)`,
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  {active && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
          {canCreate && (
            <li className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={() => {
                  const name = q.trim();
                  const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]!.value;
                  onCreate?.(name, color);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="size-3.5 shrink-0" />
                <span className="truncate">Créer « {q.trim()} »</span>
              </button>
            </li>
          )}
        </ul>

        {onManage && (
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Tag className="size-3.5" />
              Gérer les labels
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function LabelManagerDialog({
  open,
  onOpenChange,
  labels,
  onCreate,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  labels: EmailLabel[];
  onCreate: (name: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]!.value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setColor(LABEL_COLORS[0]!.value);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleCreate = () => {
    const v = name.trim();
    if (!v) return;
    onCreate(v, color);
    setName("");
    toast.success(`Label « ${v} » créé`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dialog-content">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Gérer les labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nouveau label
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Nom du label…"
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim()}
                className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.name}
                  title={c.name}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform",
                    color === c.value
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Labels existants ({labels.length})
            </span>
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {labels.length === 0 && (
                <li className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                  Aucun label pour l'instant
                </li>
              )}
              {labels.map((l) => (
                <li key={l.id} className="flex items-center gap-2 px-3 py-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">{l.name}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(l.id)}
                    aria-label={`Supprimer ${l.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
          >
            Fermer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
