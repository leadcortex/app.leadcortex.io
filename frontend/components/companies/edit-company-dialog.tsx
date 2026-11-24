// frontend/components/companies/edit-company-dialog.tsx

import { useEffect, useState, type ReactNode } from "react";
import {
  Building2,
  Check,
  DollarSign,
  Edit,
  Globe,
  Image as ImageIcon,
  Layers,
  MapPin,
  Target,
  Users,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchSelect } from "@/components/common/search-select";
import { ScoreStepper } from "@/components/ui/score-stepper";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  INDUSTRY_OPTIONS,
  SIZE_OPTIONS,
  INTENT_OPTIONS,
} from "@/lib/companies/helpers";
import { cn } from "@/lib/core/utils";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0_2px_0_var(--border)] focus:shadow-none focus:translate-y-[2px] active:translate-y-[2px] active:shadow-none";

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

export type EditCompanyDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: any;
  onSave: (patch: any) => void;
};

export function EditCompanyDialog({
  open,
  onOpenChange,
  company,
  onSave,
}: EditCompanyDialogProps) {
  const [form, setForm] = useState({
    name: "",
    domain: "",
    industry: "",
    location: "",
    employees: "",
    revenue: "",
    size: "",
    intent: "warm",
    linkedin: "",
    website: "",
    description: "",
    companyLogoUrl: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: company.name || "",
      domain: company.domain || "",
      industry: company.industry || "",
      location: company.location || "",
      employees:
        company.employees !== null && company.employees !== undefined
          ? String(company.employees)
          : "",
      revenue: company.revenue || "",
      size: company.size || "",
      intent: company.intent || "warm",
      linkedin: company.linkedin || "",
      website: company.website || "",
      description: company.description || "",
      companyLogoUrl: company.companyLogoUrl || "",
    });
  }, [open, company]);

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      employees: form.employees ? Number(form.employees) : 0,
      companyLogoUrl: form.companyLogoUrl || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl border-2 border-border shadow-[0_4px_0_var(--border)]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="flex shrink-0 flex-col gap-1 border-b border-border py-4 pl-5 pr-14 bg-surface/10">
            <DialogTitle className="font-display text-xl italic flex items-center gap-2">
              <Edit className="size-4 text-primary" />
              Modifier l'entreprise
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Les modifications sont propagées aux contacts liés si vous cochez l'option.
            </DialogDescription>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 bg-background">
            <div className="space-y-6">
              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <ImageIcon className="size-3 text-primary inline mr-1.5" />
                  Identité visuelle
                </legend>
                <div className="max-w-[200px]">
                  <ImageUploader
                    type="logo"
                    name={form.name}
                    src={form.companyLogoUrl}
                    onChange={(url) => update("companyLogoUrl", url)}
                    label="Logo entreprise"
                  />
                </div>
              </fieldset>

              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Building2 className="size-3 text-primary inline mr-1.5" />
                  Informations générales
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nom" required icon={Building2}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputCls}
                      required
                    />
                  </Field>
                  <Field label="Domaine" icon={Globe}>
                    <input
                      type="text"
                      value={form.domain}
                      onChange={(e) => update("domain", e.target.value)}
                      className={inputCls}
                      placeholder="entreprise.com"
                    />
                  </Field>
                  <Field label="Industrie">
                    <SearchSelect
                      value={form.industry}
                      onChange={(v) => update("industry", v)}
                      options={INDUSTRY_OPTIONS}
                      placeholder="Sélectionner…"
                      searchPlaceholder="Rechercher…"
                      title="Secteurs"
                      allowCustom
                      allowClear
                    />
                  </Field>
                  <Field label="Localisation" icon={MapPin}>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      className={inputCls}
                      placeholder="Paris, FR"
                    />
                  </Field>
                  <Field label="Effectif" icon={Users}>
                    <input
                      type="number"
                      value={form.employees}
                      onChange={(e) => update("employees", e.target.value)}
                      className={inputCls}
                      min="0"
                    />
                  </Field>
                  <Field label="Chiffre d'affaires" icon={DollarSign}>
                    <input
                      type="text"
                      value={form.revenue}
                      onChange={(e) => update("revenue", e.target.value)}
                      className={inputCls}
                      placeholder="12M€"
                    />
                  </Field>
                  <Field label="Tranche de taille" icon={Layers}>
                    <SearchSelect
                      value={form.size}
                      onChange={(v) => update("size", v)}
                      options={SIZE_OPTIONS}
                      placeholder="Sélectionner…"
                      searchPlaceholder="Rechercher…"
                      title="Tranches de taille"
                      allowClear
                    />
                  </Field>
                  <Field label="Intention d'achat" icon={Target}>
                    <SearchSelect
                      value={form.intent}
                      onChange={(v) => update("intent", v)}
                      options={INTENT_OPTIONS}
                      placeholder="Sélectionner…"
                      searchPlaceholder="Rechercher…"
                      title="Niveau d'intention"
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Globe className="size-3 text-primary inline mr-1.5" />
                  Liens & contexte
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="LinkedIn">
                    <input
                      type="text"
                      value={form.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      className={inputCls}
                      placeholder="linkedin.com/company/..."
                    />
                  </Field>
                  <Field label="Site web">
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                      className={inputCls}
                      placeholder="https://…"
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Description / contexte">
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      rows={3}
                      className={cn(inputCls, "resize-none")}
                      placeholder="Activité, enjeux, signaux détectés..."
                    />
                  </Field>
                </div>
              </fieldset>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-surface/10 px-5 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-background hover:bg-surface shadow-[0_2px_0_var(--border)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Check className="size-3.5" /> Enregistrer
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
