//frontend\components\edit-record-dialog.tsx
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type EditFieldOption = { value: string; label: string; description?: string };

export type EditField = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: EditFieldOption[];
  rows?: number;
  col?: 0 | 1;
};

export type EditRecordDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  values: Record<string, unknown>;
  fields: EditField[];
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => void;
  saveLabel?: string;
  cancelLabel?: string;
};

export function EditRecordDialog({
  open,
  title,
  description,
  values,
  fields,
  onClose,
  onSave,
  saveLabel = "Enregistrer",
  cancelLabel = "Annuler",
}: EditRecordDialogProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>(values);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDraft(values);
      setErrors({});
    }
  }, [open, values]);

  const setValue = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const f of fields) {
      if (f.required) {
        const v = draft[f.key];
        if (v === undefined || v === null || String(v).trim() === "") {
          nextErrors[f.key] = "Champ requis";
        }
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {}
          <header className="flex shrink-0 flex-col gap-1 border-b border-border py-4 pl-5 pr-14">
            <DialogTitle className="text-sm font-semibold leading-tight md:text-base">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </header>

          {}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((f) => (
                <FieldRenderer
                  key={f.key}
                  field={f}
                  value={draft[f.key]}
                  error={errors[f.key]}
                  onChange={(v) => setValue(f.key, v)}
                />
              ))}
            </div>
          </div>

          {}
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm transition-colors hover:bg-surface"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Save className="size-3.5" /> {saveLabel}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: EditField;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const inputCls = cn(
    "w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all",
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
    error ? "border-destructive" : "border-border",
  );

  const selectOptions: SearchSelectOption[] = useMemo(
    () =>
      (field.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
        description: o.description,
      })),
    [field.options],
  );

  return (
    <div
      className={cn(
        "space-y-1.5",
        (field.type === "textarea" || field.col === 1) && "md:col-span-2",
      )}
    >
      <label className="block text-xs font-medium text-foreground">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 3}
          className={cn(inputCls, "resize-y")}
        />
      ) : field.type === "select" ? (
        <SearchSelect
          value={String(value ?? "")}
          onChange={(v) => onChange(v)}
          options={selectOptions}
          placeholder={field.placeholder ?? "Sélectionner…"}
          searchPlaceholder="Rechercher…"
          title={field.label}
          emptyMessage="Aucun résultat."
        />
      ) : (
        <input
          type={field.type ?? "text"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      )}

      {error && <p className="text-[10.5px] text-destructive">{error}</p>}
    </div>
  );
}
