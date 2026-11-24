// frontend/routes/app/people/new.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  User as UserIcon,
  UserRound,
  Briefcase,
  Building2,
  Mail,
  Phone as PhoneIcon,
  Linkedin,
  ChevronDown,
  Search,
  Loader2,
  MapPin,
  Globe,
  Tag,
  Radio,
  Gauge,
  StickyNote,
  X,
  Image as ImageIcon,
  TrendingUp,
  CheckCircle2,
  Circle,
  Info,
} from "@/components/icons";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { CreateFormSkeleton } from "@/components/skeletons";
import { SearchSelect, type SearchSelectOption } from "@/components/common/search-select";
import {
  COUNTRY_CODES,
  REGION_ORDER,
  flagFromIso,
  getCountryByIso,
} from "@/components/ai-assistant/country-codes";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";
import { CompanyLogo } from "@/components/company-logo";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { ProgressCapsule } from "@/components/ui/capsule-progress";
import { PageHeader } from "@/components/common/ui-primitives";
import { ScoreStepper } from "@/components/ui/score-stepper";
import { ImageUploader } from "@/components/ui/image-uploader";
import { KeyboardShortcutsDialog } from "@/components/common/keyboard-shortcuts-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { searchCompanies, type CompanyResult, guessDomainFromName } from "@/lib/companies/database";
import {
  INDUSTRY_OPTIONS,
  SIGNAL_OPTIONS,
  STAGE_OPTIONS,
} from "@/lib/people/helpers";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/app/people/new")({
  head: () => ({ meta: [{ title: "Nouveau prospect — LeadCortex" }] }),
  pendingComponent: () => <CreateFormSkeleton />,
  component: NewPeoplePage,
});

type FormData = {
  name: string;
  title: string;
  company: string;
  companyDomain: string;
  industry: string;
  location: string;
  email: string;
  phoneCountry: string;
  phoneLocal: string;
  linkedin: string;
  website: string;
  signal: string;
  stage: string;
  score: string;
  tags: string;
  notes: string;
  avatarUrl: string;
  companyLogoUrl: string;
};

const emptyForm: FormData = {
  name: "",
  title: "",
  company: "",
  companyDomain: "",
  industry: "",
  location: "",
  email: "",
  phoneCountry: "FR",
  phoneLocal: "",
  linkedin: "",
  website: "",
  signal: "",
  stage: "new",
  score: "",
  tags: "",
  notes: "",
  avatarUrl: "",
  companyLogoUrl: "",
};

const OPTIONAL_GROUPS = {
  visual: ["avatarUrl", "companyLogoUrl"] as const,
  basics: ["industry", "location"] as const,
  contact: ["email", "phoneLocal", "linkedin", "website"] as const,
  qualif: ["signal", "score", "tags", "notes"] as const,
};

const OPTIONAL_TOTAL = Object.values(OPTIONAL_GROUPS).reduce((n, arr) => n + arr.length, 0);

const COUNTRY_OPTIONS: SearchSelectOption[] = (() => {
  const sorted = [...COUNTRY_CODES].sort((a, b) => {
    const ra = REGION_ORDER.indexOf(a.region);
    const rb = REGION_ORDER.indexOf(b.region);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "fr");
  });
  return sorted.map((c) => ({
    value: c.iso,
    label: c.name,
    description: `${c.dial} · ${c.iso}`,
    icon: <span className="text-base leading-none">{c.flag}</span>,
    keywords: `${c.iso} ${c.dial} ${c.name.toLowerCase()} ${c.region.toLowerCase()}`,
    group: c.region,
  }));
})();

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

function ProgressRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const complete = value === max;
  return (
    <li className="list-item-atelier p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-medium truncate">{label}</span>
        <span className="counter-pill counter-pill--sm">
          {value}/{max}
        </span>
      </div>
      <ProgressCapsule value={value} max={max} size="sm" tone={complete ? "success" : "primary"} />
    </li>
  );
}

function ProgressCard({
  requiredFilled,
  requiredTotal,
  optionalFilled,
  optionalTotal,
  percent,
}: {
  requiredFilled: number;
  requiredTotal: number;
  optionalFilled: number;
  optionalTotal: number;
  percent: number;
}) {
  const requiredComplete = requiredFilled === requiredTotal;
  return (
    <div className="rounded-2xl border-2 border-border bg-background p-4 md:p-5 shadow-[0_3px_0_var(--border)]">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-primary" />
          Complétion de la fiche
        </h3>
        <span className="font-display text-lg md:text-xl italic text-primary tabular-nums">
          {percent}%
        </span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary shadow-[inset_0_1px_0_color-mix(in_oklab,white_45%,transparent)] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            requiredComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
          )}
        >
          {requiredComplete ? (
            <CheckCircle2 className="size-2.5" />
          ) : (
            <Circle className="size-2.5" />
          )}
          Obligatoires : {requiredFilled}/{requiredTotal}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          <Sparkles className="size-2.5" />
          Optionnels : {optionalFilled}/{optionalTotal}
        </span>
      </div>
    </div>
  );
}

function LivePreviewCard({ form, companyQuery }: { form: FormData; companyQuery: string }) {
  const displayName = form.name.trim() || "Nouveau prospect";
  const displayTitle = form.title.trim() || "Poste à définir";
  const displayCompany = form.company.trim() || companyQuery.trim() || "Entreprise à définir";
  const dial = getCountryByIso(form.phoneCountry)?.dial ?? "+33";
  const stageLabel =
    STAGE_OPTIONS.find((s) => s.value === form.stage)?.label ?? form.stage ?? "Nouveau";

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {form.avatarUrl ? (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "9999px",
                overflow: "hidden",
                boxShadow: "0 0 0 2px color-mix(in oklab, var(--primary) 20%, transparent)",
              }}
            >
              <img
                src={form.avatarUrl}
                alt=""
                draggable={false}
                style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <LetterAvatar name={displayName} size={64} shape="circle" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg italic leading-tight truncate">{displayName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{displayTitle}</p>
          <div className="mt-2 flex items-center gap-1.5 min-w-0">
            {form.companyLogoUrl ? (
              <div
                className="shrink-0"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  overflow: "hidden",
                  backgroundColor: "var(--background)",
                }}
              >
                <img
                  src={form.companyLogoUrl}
                  alt=""
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <CompanyLogo name={displayCompany} size={14} className="shrink-0" />
            )}
            <span className="text-xs truncate">{displayCompany}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="counter-pill counter-pill--sm">{stageLabel}</span>
        {form.signal && (
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
            <Radio className="size-2.5 shrink-0" />
            <span className="truncate">{form.signal}</span>
          </span>
        )}
        {form.score && (
          <span className="counter-pill counter-pill--sm">{Number(form.score).toFixed(1)}/10</span>
        )}
      </div>

      {(form.email || form.phoneLocal) && (
        <div className="space-y-1 pt-3 border-t border-border/60">
          {form.email && (
            <p className="text-[10px] font-mono text-muted-foreground truncate flex items-center gap-1">
              <Mail className="size-2.5 shrink-0" />
              {form.email}
            </p>
          )}
          {form.phoneLocal && (
            <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
              <PhoneIcon className="size-2.5 shrink-0" />
              {dial} {form.phoneLocal}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
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

function NewPeoplePage() {
  const navigate = useNavigate();
  const { addActivity, addLead, companies } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyDropdownStyle, setCompanyDropdownStyle] = useState<CSSProperties | null>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const currentCountry = useMemo(
    () => getCountryByIso(form.phoneCountry) ?? getCountryByIso("FR")!,
    [form.phoneCountry],
  );

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const q = companyQuery.trim();
    if (!q) {
      setCompanyResults([]);
      return;
    }
    setCompanyLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchCompanies(q, 8);
      setCompanyResults(data);
      setCompanyLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [companyQuery]);

  const userCompaniesFiltered = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies.slice(0, 5);
    return companies
      .filter(
        (c) => c.name.toLowerCase().includes(q) || (c.domain ?? "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [companies, companyQuery]);

  const hasAnyResult = userCompaniesFiltered.length > 0 || companyResults.length > 0;

  const computeDropdownStyle = useCallback(() => {
    if (!companyInputRef.current) return;
    const r = companyInputRef.current.getBoundingClientRect();
    const spaceAbove = r.top - 8;
    const vh = window.innerHeight;
    if (spaceAbove >= 200) {
      setCompanyDropdownStyle({
        position: "fixed",
        top: r.top - 4,
        left: r.left,
        width: r.width,
        maxHeight: Math.min(380, spaceAbove),
        transform: "translateY(-100%)",
        zIndex: 9999,
      });
    } else {
      setCompanyDropdownStyle({
        position: "fixed",
        top: r.bottom + 4,
        left: r.left,
        width: r.width,
        maxHeight: Math.min(380, vh - r.bottom - 20),
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (!companyOpen) return;
    computeDropdownStyle();
    const h = () => computeDropdownStyle();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.removeEventListener("resize", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [companyOpen, computeDropdownStyle]);

  useEffect(() => {
    if (!companyOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (companyInputRef.current?.contains(t)) return;
      if (t.closest?.("[data-company-dropdown]")) return;
      setCompanyOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompanyOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [companyOpen]);

  const selectUserCompany = (c: (typeof companies)[number]) => {
    setForm((prev) => ({
      ...prev,
      company: c.name,
      companyDomain: c.domain ?? "",
      industry: prev.industry || c.industry,
      location: prev.location || c.location,
    }));
    setCompanyOpen(false);
    setCompanyQuery("");
  };

  const selectApiCompany = (c: CompanyResult) => {
    const domain = c.domain || guessDomainFromName(c.name) || "";
    setForm((prev) => ({
      ...prev,
      company: c.name,
      companyDomain: domain,
      industry: prev.industry || c.industry,
      location: prev.location || c.location,
    }));
    setCompanyOpen(false);
    setCompanyQuery("");
  };

  const handleOpenAiAssistant = () => {
    setIsGenerating(true);
    setTimeout(() => {
      openAssistant({
        prompt: `Génère une fiche prospect complète à partir des informations ci-dessous.\n\nNom :\nPoste :\nEntreprise :\nSecteur :\nLocalisation :\nEmail :\nTéléphone :\nLinkedIn :\nSignal :\nScore estimé (0-10) :\nTags :`,
      });
      setIsGenerating(false);
      toast.success("Assistant IA ouvert");
    }, 300);
  };

  const computedCompany = form.company.trim() || companyQuery.trim();
  const canGoStep2 = Boolean(form.name.trim() && form.title.trim() && computedCompany);

  const requiredFilled = [form.name.trim(), form.title.trim(), computedCompany].filter(
    Boolean,
  ).length;
  const requiredTotal = 3;

  const visualFilled = OPTIONAL_GROUPS.visual.filter((k) => String(form[k]).trim() !== "").length;
  const basicsFilled = OPTIONAL_GROUPS.basics.filter((k) => String(form[k]).trim() !== "").length;
  const contactFilled = OPTIONAL_GROUPS.contact.filter(
    (k) => String(form[k]).trim() !== "",
  ).length;
  const qualifFilled = OPTIONAL_GROUPS.qualif.filter((k) => String(form[k]).trim() !== "").length;

  const optionalFilled = visualFilled + basicsFilled + contactFilled + qualifFilled;
  const totalFilled = requiredFilled + optionalFilled;
  const totalFields = requiredTotal + OPTIONAL_TOTAL;
  const completionPercent = Math.round((totalFilled / totalFields) * 100);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalCompany = form.company.trim() || companyQuery.trim();
    if (!form.name.trim() || !form.title.trim() || !finalCompany) {
      toast.error("Remplissez les champs obligatoires : nom, poste et entreprise");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      const fullPhone = form.phoneLocal.trim()
        ? `${currentCountry.dial} ${form.phoneLocal.trim()}`
        : undefined;
      const created = addLead({
        name: form.name.trim(),
        title: form.title.trim(),
        company: finalCompany,
        industry: form.industry || "—",
        location: form.location || "—",
        status: "queued",
        score: form.score ? Number(form.score) : null,
        email: form.email || undefined,
        phone: fullPhone,
        signal: form.signal || undefined,
        stage: (form.stage as any) || "new",
        saved: false,
        avatarUrl: form.avatarUrl || undefined,
        companyLogoUrl: form.companyLogoUrl || undefined,
      });
      addActivity("Prospect créé", `${form.name} — ${finalCompany}`);
      toast.success(`Prospect ${form.name.trim()} créé`, {
        description: "Vous pouvez compléter la fiche à tout moment.",
      });
      navigate({ to: "/app/people/$id", params: { id: created.id } });
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  useKeyboardShortcuts([
    { key: "s", mod: true, handler: () => handleSubmit() },
    { key: "enter", mod: true, handler: () => handleSubmit() },
    { key: "/", mod: true, handler: () => setShortcutsOpen(true) },
    { key: "?", handler: () => setShortcutsOpen(true) },
    {
      key: "escape",
      handler: () => {
        if (shortcutsOpen) setShortcutsOpen(false);
        else if (companyOpen) setCompanyOpen(false);
      },
    },
  ]);

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: "/app/people" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground shadow-[0_1px_0_var(--border)]"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Prospects</span>
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground shadow-[0_1px_0_var(--border)]"
          title="Raccourcis (⌘/)"
        >
          <kbd className="font-mono">?</kbd>
          <span className="hidden sm:inline">Raccourcis</span>
        </button>
      </div>

      <PageHeader
        eyebrow="Nouveau prospect"
        title="Créer une fiche."
        description="Tous les champs obligatoires en haut. Complétez le reste à votre rythme."
        actions={
          <button
            type="button"
            onClick={handleOpenAiAssistant}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors disabled:opacity-50 shadow-[0_1px_0_color-mix(in_oklab,var(--primary)_20%,transparent)]"
          >
            <Sparkles className="size-3.5" />
            {isGenerating ? "…" : "Remplir avec l'IA"}
          </button>
        }
      />

      <div className="mb-5 md:mb-6">
        <ProgressCard
          requiredFilled={requiredFilled}
          requiredTotal={requiredTotal}
          optionalFilled={optionalFilled}
          optionalTotal={OPTIONAL_TOTAL}
          percent={completionPercent}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 md:gap-6 items-start pb-4 lg:pb-0">
          <div className="space-y-4 md:space-y-5 min-w-0">
            <section className="section-atelier p-4 md:p-6">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base md:text-lg">
                    L'essentiel
                  </h2>
                </div>
                <span className="counter-pill shrink-0">
                  {[form.name, form.title, computedCompany].filter(Boolean).length}/3
                </span>
              </div>

              <p className="mb-4 text-xs text-muted-foreground">
                Qui est ce prospect et où travaille-t-il ?
              </p>

              <div className="mb-4 rounded-xl border border-border bg-surface/20 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
                  <ImageIcon className="size-3 text-primary" />
                  Identité visuelle
                  <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-muted-foreground/70">
                    Optionnel
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ImageUploader
                    type="avatar"
                    name={form.name}
                    src={form.avatarUrl}
                    onChange={(url) => update("avatarUrl", url)}
                    label="Photo"
                  />
                  <ImageUploader
                    type="logo"
                    name={form.company || companyQuery}
                    src={form.companyLogoUrl}
                    onChange={(url) => update("companyLogoUrl", url)}
                    label="Logo entreprise"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Nom complet" required icon={UserIcon}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jean Dupont"
                    required
                    className={inputCls}
                    autoFocus
                  />
                </Field>

                <Field label="Poste" required icon={Briefcase}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Quelle est sa fonction…"
                    required
                    className={inputCls}
                  />
                </Field>

                <Field label="Entreprise" required icon={Building2}>
                  <div className="relative">
                    {!companyOpen && form.company ? (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-background pl-2.5 pr-1 h-[38px]">
                        <CompanyLogo
                          name={form.company}
                          domain={form.companyDomain || undefined}
                          logoUrl={form.companyLogoUrl || undefined}
                          size={20}
                          className="shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyQuery(form.company);
                            setCompanyOpen(true);
                          }}
                          className="flex-1 min-w-0 text-left text-sm truncate"
                        >
                          {form.company}
                        </button>
                        {form.industry && (
                          <span className="shrink-0 truncate text-[10px] text-muted-foreground max-w-[100px]">
                            {form.industry}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            update("company", "");
                            update("companyDomain", "");
                            setCompanyQuery("");
                          }}
                          className="shrink-0 rounded p-1 hover:bg-surface transition-colors"
                          aria-label="Effacer l'entreprise"
                        >
                          <X className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          ref={companyInputRef}
                          type="text"
                          value={companyQuery}
                          onChange={(e) => {
                            setCompanyQuery(e.target.value);
                            setCompanyOpen(true);
                          }}
                          onFocus={() => setCompanyOpen(true)}
                          placeholder="Rechercher ou saisir une entreprise…"
                          className={cn(inputCls, "pl-9 pr-8")}
                          autoFocus
                        />
                        {companyLoading && (
                          <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  {!form.company && companyQuery.trim() && (
                    <p className="mt-1 text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <Info className="size-3" />
                      Sera utilisé tel quel. Sélectionnez une suggestion pour plus de détails.
                    </p>
                  )}
                </Field>

                <Field label="Secteur">
                  <SearchSelect
                    value={form.industry}
                    onChange={(v) => update("industry", v)}
                    options={INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i }))}
                    placeholder="Sélectionner un secteur…"
                    searchPlaceholder="Marketing…"
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
                    placeholder="Paris"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="section-atelier p-4 md:p-6">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base md:text-lg">
                    Coordonnées
                  </h2>
                </div>
                <span className="counter-pill shrink-0">{contactFilled}/4</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Comment allez-vous contacter ce prospect ? Tout est optionnel.
              </p>
              <div className="space-y-4">
                <Field label="Email" icon={Mail}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jean.dupont@entreprise.fr"
                    className={inputCls}
                  />
                </Field>

                <Field label="Téléphone" icon={PhoneIcon}>
                  <div className="flex items-stretch gap-2">
                    <SearchSelect
                      className="w-[120px] shrink-0"
                      value={form.phoneCountry}
                      onChange={(v) => update("phoneCountry", v)}
                      options={COUNTRY_OPTIONS}
                      placeholder="FR"
                      searchPlaceholder="Pays…"
                      title="Choisir un pays"
                      minPanelWidth={340}
                      renderTrigger={(selected) => {
                        const dial = selected ? getCountryByIso(selected.value)?.dial : "+33";
                        return (
                          <span className="flex h-[38px] items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm hover:border-primary/40 transition-colors">
                            <span className="text-base leading-none">
                              {flagFromIso(selected?.value ?? "FR")}
                            </span>
                            <span className="font-mono text-[12px]">{dial}</span>
                            <ChevronDown className="size-3 text-muted-foreground" />
                          </span>
                        );
                      }}
                    />
                    <input
                      type="tel"
                      inputMode="tel"
                      value={form.phoneLocal}
                      onChange={(e) => update("phoneLocal", e.target.value)}
                      placeholder="6 12 34 56 78"
                      className={cn(inputCls, "flex-1")}
                    />
                  </div>
                </Field>

                <Field label="LinkedIn" icon={Linkedin}>
                  <input
                    type="text"
                    value={form.linkedin}
                    onChange={(e) => update("linkedin", e.target.value)}
                    placeholder="linkedin.com/in/jean-dupont"
                    className={inputCls}
                  />
                </Field>

                <Field label="Site web" icon={Globe}>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://entreprise.com"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="section-atelier p-4 md:p-6">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base md:text-lg">
                    Qualification
                  </h2>
                </div>
                <span className="counter-pill shrink-0">{qualifFilled}/4</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Aidez l'IA à prioriser. Tout est optionnel.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Étape" icon={Check}>
                    <SearchSelect
                      value={form.stage}
                      onChange={(v) => update("stage", v)}
                      options={STAGE_OPTIONS}
                      placeholder="Sélectionner…"
                      searchPlaceholder="Rechercher une étape…"
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
                </div>

                <Field label="Signal d'intérêt" icon={Radio}>
                  <SearchSelect
                    value={form.signal}
                    onChange={(v) => update("signal", v)}
                    options={SIGNAL_OPTIONS.map((s) => ({ value: s, label: s }))}
                    placeholder="Sélectionner ou créer…"
                    searchPlaceholder="Rechercher un signal…"
                    title="Signaux"
                    allowCustom
                    allowClear
                  />
                </Field>

                <Field label="Tags" icon={Tag}>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => update("tags", e.target.value)}
                    placeholder="prioritaire, salon 2026…"
                    className={inputCls}
                  />
                </Field>

                <Field label="Notes internes" icon={StickyNote}>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                    placeholder="Contexte, historique, prochaine action…"
                    className={cn(inputCls, "resize-none")}
                  />
                </Field>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-4 space-y-4">
            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Aperçu</h2>
                </div>
                <span className="counter-pill counter-pill--sm">{completionPercent}%</span>
              </div>
              <LivePreviewCard form={form} companyQuery={companyQuery} />
            </section>

            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Progression</h2>
                </div>
                <span className="counter-pill counter-pill--sm">
                  {optionalFilled}/{OPTIONAL_TOTAL}
                </span>
              </div>
              <ul className="space-y-2">
                <ProgressRow
                  label="Identité visuelle"
                  value={visualFilled}
                  max={OPTIONAL_GROUPS.visual.length}
                />
                <ProgressRow
                  label="Infos de base"
                  value={basicsFilled}
                  max={OPTIONAL_GROUPS.basics.length}
                />
                <ProgressRow
                  label="Coordonnées"
                  value={contactFilled}
                  max={OPTIONAL_GROUPS.contact.length}
                />
                <ProgressRow
                  label="Qualification"
                  value={qualifFilled}
                  max={OPTIONAL_GROUPS.qualif.length}
                />
              </ul>
            </section>

            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Info className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Astuces</h2>
                </div>
              </div>
              <ul className="space-y-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-3 mt-0.5 shrink-0 text-primary" />
                  <span>
                    Remplissez au moins{" "}
                    <b className="text-foreground">nom, poste et entreprise</b> pour enregistrer.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="size-3 mt-0.5 shrink-0 text-primary" />
                  <span>Tout le reste est optionnel — complétez plus tard si besoin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="size-3 mt-0.5 shrink-0 text-primary" />
                  <span>Le score et les signaux aident l'IA à prioriser vos actions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <kbd className="rounded border border-border bg-surface px-1 font-mono text-[9.5px]">
                    ⌘S
                  </kbd>
                  <span>enregistre la fiche depuis n'importe où.</span>
                </li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="sticky bottom-0 z-30 -mx-3 md:mx-0 md:static mt-4 md:mt-6">
          <div className="rounded-t-2xl md:rounded-2xl border border-border bg-background/95 px-4 py-3 md:px-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur md:shadow-none md:backdrop-blur-none md:bg-background">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: "/app/people" })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg bg-background hover:bg-surface transition-colors shadow-[0_2px_0_var(--border)] active:translate-y-[2px] active:shadow-none"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canGoStep2}
                title={!canGoStep2 ? "Remplissez nom, poste et entreprise" : undefined}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:translate-y-[2px] active:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Créer le prospect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {companyOpen &&
        companyDropdownStyle &&
        createPortal(
          <div
            data-company-dropdown
            style={companyDropdownStyle}
            className="overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95"
          >
            {userCompaniesFiltered.length > 0 && (
              <>
                <p className="border-b border-border/60 bg-surface/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Mes entreprises
                </p>
                {userCompaniesFiltered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectUserCompany(c)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface"
                  >
                    <CompanyLogo
                      name={c.name}
                      domain={c.domain ?? undefined}
                      logoUrl={c.companyLogoUrl || undefined}
                      size={24}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{c.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {c.industry} · {c.location}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {companyResults.length > 0 && (
              <>
                <p
                  className={cn(
                    "border-b border-border/60 bg-surface/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
                    userCompaniesFiltered.length > 0 && "border-t border-border",
                  )}
                >
                  Suggestions
                </p>
                {companyResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectApiCompany(c)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface"
                  >
                    <CompanyLogo name={c.name} size={24} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{c.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {c.industry} · {c.location}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{c.category}</span>
                  </button>
                ))}
              </>
            )}

            {companyLoading && !hasAnyResult && (
              <div className="p-4 text-center">
                <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!companyLoading && !hasAnyResult && (
              <p className="px-3 py-5 text-center text-[11px] text-muted-foreground">
                {companyQuery.trim()
                  ? "Aucune entreprise trouvée — le nom saisi sera conservé."
                  : "Tapez pour rechercher une entreprise"}
              </p>
            )}
          </div>,
          document.body,
        )}

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
