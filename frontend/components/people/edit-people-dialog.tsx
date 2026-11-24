// frontend/components/people/edit-people-dialog.tsx

import { useEffect, useState, type ReactNode } from "react";
import {
  Briefcase,
  Building2,
  Check,
  Edit,
  Gauge,
  Globe,
  Image as ImageIcon,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Radio,
  Sparkles,
  StickyNote,
  Tag as TagIcon,
  User as UserIcon,
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
  SIGNAL_OPTIONS,
  STAGE_OPTIONS,
} from "@/lib/people/helpers";
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

export type EditPeopleDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onSave: (patch: any) => void;
};

export function EditPeopleDialog({ open, onOpenChange, lead, onSave }: EditPeopleDialogProps) {
  const [form, setForm] = useState({
    name: "",
    title: "",
    company: "",
    industry: "",
    location: "",
    email: "",
    phone: "",
    linkedin: "",
    website: "",
    signal: "",
    stage: "new",
    score: "",
    tags: "",
    notes: "",
    avatarUrl: "",
    companyLogoUrl: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: lead.name || "",
      title: lead.title || "",
      company: lead.company || "",
      industry: lead.industry || "",
      location: lead.location || "",
      email: lead.email || "",
      phone: lead.phone || "",
      linkedin: lead.linkedin || "",
      website: lead.website || "",
      signal: lead.signal || "",
      stage: lead.stage || "new",
      score: lead.score !== null && lead.score !== undefined ? String(lead.score) : "",
      tags: lead.tags || "",
      notes: lead.notes || "",
      avatarUrl: lead.avatarUrl || "",
      companyLogoUrl: lead.companyLogoUrl || "",
    });
  }, [open, lead]);

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      score: form.score ? Number(form.score) : null,
      avatarUrl: form.avatarUrl || undefined,
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
              Modifier le prospect
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mettez à jour toutes les informations de la fiche.
            </DialogDescription>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 bg-background">
            <div className="space-y-6">
              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <ImageIcon className="size-3 text-primary inline mr-1.5" />
                  Identité visuelle
                  <span className="ml-1 text-[9px] font-normal normal-case text-muted-foreground/70">
                    (Optionnel)
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  <ImageUploader
                    type="avatar"
                    name={form.name}
                    src={form.avatarUrl}
                    onChange={(url) => update("avatarUrl", url)}
                    label="Photo"
                  />
                  <ImageUploader
                    type="logo"
                    name={form.company}
                    src={form.companyLogoUrl}
                    onChange={(url) => update("companyLogoUrl", url)}
                    label="Logo entreprise"
                  />
                </div>
              </fieldset>

              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <UserIcon className="size-3 text-primary inline mr-1.5" />
                  L'essentiel
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nom complet" required icon={UserIcon}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputCls}
                      required
                    />
                  </Field>
                  <Field label="Poste" required icon={Briefcase}>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      className={inputCls}
                      required
                    />
                  </Field>
                  <Field label="Entreprise" required icon={Building2}>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      className={inputCls}
                      required
                    />
                  </Field>
                  <Field label="Secteur">
                    <SearchSelect
                      value={form.industry}
                      onChange={(v) => update("industry", v)}
                      options={INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i }))}
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
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Phone className="size-3 text-primary inline mr-1.5" />
                  Coordonnées
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email" icon={Mail}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Téléphone" icon={Phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="LinkedIn" icon={Linkedin}>
                    <input
                      type="text"
                      value={form.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Site web" icon={Globe}>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border-2 border-border bg-surface/10 p-4 shadow-[0_3px_0_var(--border)]">
                <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Sparkles className="size-3 text-primary inline mr-1.5" />
                  Qualification
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Étape" icon={Check}>
                    <SearchSelect
                      value={form.stage}
                      onChange={(v) => update("stage", v)}
                      options={STAGE_OPTIONS}
                      placeholder="Sélectionner…"
                      searchPlaceholder="Rechercher…"
                      title="Étapes"
                    />
                  </Field>
                  <Field label="Score (0-10)" icon={Gauge}>
                    <ScoreStepper
                      value={form.score}
                      onChange={(v) => update("score", v)}
                      step={1}
                      placeholder="8.5"
                    />
                  </Field>
                  <Field label="Signal d'intérêt" icon={Radio}>
                    <SearchSelect
                      value={form.signal}
                      onChange={(v) => update("signal", v)}
                      options={SIGNAL_OPTIONS.map((s) => ({ value: s, label: s }))}
                      placeholder="Sélectionner…"
                      searchPlaceholder="Rechercher…"
                      title="Signaux"
                      allowCustom
                      allowClear
                    />
                  </Field>
                  <Field label="Tags" icon={TagIcon}>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => update("tags", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </fieldset>

              <Field label="Notes internes" icon={StickyNote}>
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
              </Field>
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
              <Edit className="size-3.5" /> Enregistrer
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
