// frontend/routes/app/companies/new.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/ui-primitives";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  CheckCircle2,
  ChevronDown,
  Building2,
  Globe,
  MapPin,
  Users,
  Linkedin,
  Tag,
  Wand2,
  DollarSign,
  Calendar,
  Layers,
  Target,
  UserCog,
  Compass,
  X,
  Image as ImageIcon,
  TrendingUp,
  Circle,
  Info,
} from "@/components/icons";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { CreateFormSkeleton } from "@/components/skeletons";
import { SearchSelect, type SearchSelectOption } from "@/components/common/search-select";
import { CompanyLogo } from "@/components/company-logo";
import { ProgressCapsule } from "@/components/ui/capsule-progress";
import { ImageUploader } from "@/components/ui/image-uploader";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";
import { searchCompanies, type CompanyResult, guessDomainFromName } from "@/lib/companies/database";
import {
  INDUSTRY_OPTIONS,
  SIZE_OPTIONS,
  INTENT_OPTIONS,
  SOURCE_OPTIONS,
  OWNER_OPTIONS,
} from "@/lib/companies/helpers";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/app/companies/new")({
  head: () => ({ meta: [{ title: "Nouvelle entreprise — LeadCortex" }] }),
  pendingComponent: () => <CreateFormSkeleton variant="company" />,
  component: NewCompanyPage,
});

type FormData = {
  name: string;
  domain: string;
  industry: string;
  location: string;
  employees: number | string;
  revenue: string;
  size: string;
  intent: "hot" | "warm" | "cold";
  linkedin: string;
  description: string;
  founded: string;
  techStack: string;
  owner: string;
  source: string;
  tags: string;
  saved: boolean;
  autoEnrich: boolean;
  companyLogoUrl: string;
};

const emptyForm: FormData = {
  name: "",
  domain: "",
  industry: "",
  location: "",
  employees: "",
  revenue: "",
  size: "",
  intent: "warm",
  linkedin: "",
  description: "",
  founded: "",
  techStack: "",
  owner: "Moi",
  source: "manual",
  tags: "",
  saved: false,
  autoEnrich: true,
  companyLogoUrl: "",
};

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

function LivePreviewCard({ form }: { form: FormData }) {
  const displayName = form.name.trim() || "Nouvelle entreprise";
  const displayDomain = form.domain.trim() || guessDomainFromName(form.name) || "—";

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {form.companyLogoUrl ? (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "0.75rem",
                overflow: "hidden",
                boxShadow: "0 0 0 2px color-mix(in oklab, var(--primary) 20%, transparent)",
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
            <CompanyLogo name={displayName} size={64} rounded="lg" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg italic leading-tight truncate">{displayName}</p>
          <p className="mt-0.5 text-[11px] font-mono text-muted-foreground truncate">
            {displayDomain}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.industry && (
              <span className="counter-pill counter-pill--sm">{form.industry}</span>
            )}
            {form.size && <span className="counter-pill counter-pill--sm">{form.size}</span>}
          </div>
        </div>
      </div>

      {(form.location || form.employees) && (
        <div className="space-y-1 pt-3 border-t border-border/60">
          {form.location && (
            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="size-2.5 shrink-0" />
              {form.location}
            </p>
          )}
          {form.employees && (
            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
              <Users className="size-2.5 shrink-0" />
              {form.employees} employés
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NewCompanyPage() {
  const navigate = useNavigate();
  const { addCompany, addActivity, companies, leads } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyDropdownStyle, setCompanyDropdownStyle] = useState<CSSProperties | null>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const set = (key: keyof FormData, value: any) => update(key, value);

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

  const matchingLeadsForName = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name) return [];
    return leads.filter((l) => l.company.trim().toLowerCase() === name);
  }, [leads, form.name]);

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
      name: c.name,
      domain: prev.domain || c.domain || "",
      industry: prev.industry || c.industry,
      location: prev.location || c.location,
      size: prev.size || c.size,
      revenue: prev.revenue || c.revenue,
      employees: prev.employees || (c.employees > 0 ? String(c.employees) : ""),
      intent: c.intent,
      companyLogoUrl: prev.companyLogoUrl || c.companyLogoUrl || "",
    }));
    setCompanyOpen(false);
    setCompanyQuery("");
    toast.info(`${c.name} chargée — complétez les champs manquants.`);
  };

  const selectApiCompany = (c: CompanyResult) => {
    const domain = c.domain || guessDomainFromName(c.name) || "";
    setForm((prev) => ({
      ...prev,
      name: c.name,
      domain: prev.domain || domain,
      industry: prev.industry || c.industry,
      location: prev.location || c.location,
      size: prev.size || c.size,
      employees: prev.employees || (c.employees > 0 ? String(c.employees) : ""),
    }));
    setCompanyOpen(false);
    setCompanyQuery("");
    toast.info(`${c.name} importée depuis l'API.`);
  };

  const completionPercent = useMemo(() => {
    const required = [form.name, form.domain, form.industry].filter(
      (f) => String(f).trim() !== "",
    ).length;
    const optional = [
      form.location,
      String(form.employees),
      form.revenue,
      form.size,
      form.linkedin,
      form.description,
      form.tags,
      form.companyLogoUrl,
    ].filter((f) => String(f).trim() !== "").length;
    return Math.round(((required + optional) / 11) * 100);
  }, [form]);

  const requiredFilled = [form.name, form.domain, form.industry].filter(
    (f) => String(f).trim() !== "",
  ).length;
  const optionalFilled = [
    form.location,
    String(form.employees),
    form.revenue,
    form.size,
    form.linkedin,
    form.description,
    form.tags,
    form.companyLogoUrl,
  ].filter((f) => String(f).trim() !== "").length;
  const optionalTotal = 8;

  const AI_PROMPT_TEMPLATE = `Crée une nouvelle entreprise à partir des informations ci-dessous.

Renseigne chaque ligne (une information par ligne, tu peux laisser vide ce que tu ne sais pas) :

▸ Nom de l'entreprise :
▸ Domaine (site web) :
▸ Secteur :
▸ Localisation (Ville, Pays) :
▸ Effectif estimé :
▸ Chiffre d'affaires :
▸ Tranche de taille (1-10, 11-50, 51-200, 201-500, 500-1K, 1K-5K, 5K+) :
▸ Intention d'achat (forte / moyenne / faible) :
▸ LinkedIn (URL entreprise) :
▸ Année de création :
▸ Stack technique :
▸ Propriétaire du compte :
▸ Source :
▸ Tags :
▸ Description / contexte commercial :

Consignes :
• Utilise uniquement des sources publiques fiables (site officiel, LinkedIn, actualités récentes).
• Signale explicitement les informations incertaines ou non trouvées.
• Propose un angle d'approche commerciale en 2 phrases.`;

  const handleOpenAiAssistant = () => {
    setIsGenerating(true);
    setTimeout(() => {
      openAssistant({ prompt: AI_PROMPT_TEMPLATE });
      setIsGenerating(false);
      toast.success("Assistant IA ouvert", {
        description: "Complétez les balises du prompt pour générer la fiche.",
      });
    }, 300);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalName = form.name.trim() || companyQuery.trim();
    if (!finalName) {
      toast.error("Le nom de l'entreprise est requis");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    try {
      const domain = form.domain.trim() || guessDomainFromName(finalName) || "";

      const created = addCompany({
        name: finalName,
        domain,
        industry: form.industry || "Technology",
        location: form.location || "—",
        size: form.size || "—",
        revenue: form.revenue || "—",
        employees: Number(form.employees) || 0,
        intent: form.intent,
        saved: form.saved,
        companyLogoUrl: form.companyLogoUrl || undefined,
        linkedin: form.linkedin || undefined,
        website: form.domain ? `https://${form.domain}` : undefined,
        description: form.description || undefined,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
      });

      addActivity("Entreprise créée", finalName);
      toast.success(`Entreprise ${finalName} créée`, {
        description: matchingLeadsForName.length
          ? `${matchingLeadsForName.length} contact${matchingLeadsForName.length > 1 ? "s" : ""} existant${matchingLeadsForName.length > 1 ? "s" : ""} déjà lié${matchingLeadsForName.length > 1 ? "s" : ""}.`
          : "Vous pouvez ajouter des contacts depuis la fiche.",
      });

      await new Promise((r) => setTimeout(r, 0));
      navigate({ to: "/app/companies/$id", params: { id: created.id } });
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => navigate({ to: "/app/companies" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground shadow-[0_1px_0_var(--border)]"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Entreprises</span>
        </button>
      </div>

      <PageHeader
        eyebrow="Nouvelle entreprise"
        title="Créer une fiche."
        description="Renseignez les champs obligatoires, complétez le reste à votre rythme."
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

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 md:gap-6 items-start pb-4 lg:pb-0">
          <div className="space-y-4 md:space-y-5 min-w-0">
            <section className="section-atelier p-4 md:p-6">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base md:text-lg">
                    L'essentiel
                  </h2>
                </div>
                <span className="counter-pill shrink-0">
                  {[form.name, form.domain, form.industry].filter(Boolean).length}/3
                </span>
              </div>

              <p className="mb-4 text-xs text-muted-foreground">
                Les champs marqués d'un * sont obligatoires.
              </p>

              <div className="mb-4 rounded-xl border border-border bg-surface/20 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
                  <ImageIcon className="size-3 text-primary" />
                  Logo
                  <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-muted-foreground/70">
                    Optionnel
                  </span>
                </div>
                <div className="max-w-[200px]">
                  <ImageUploader
                    type="logo"
                    name={form.name}
                    src={form.companyLogoUrl}
                    onChange={(url) => update("companyLogoUrl", url)}
                    label="Logo entreprise"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Nom de l'entreprise" required icon={Building2}>
                  <div className="relative">
                    {!companyOpen && form.name ? (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-background pl-2.5 pr-1 h-[38px]">
                        <CompanyLogo
                          name={form.name}
                          domain={form.domain || undefined}
                          logoUrl={form.companyLogoUrl || undefined}
                          size={20}
                          className="shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyQuery(form.name);
                            setCompanyOpen(true);
                          }}
                          className="flex-1 min-w-0 text-left text-sm truncate"
                        >
                          {form.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            update("name", "");
                            update("domain", "");
                            setCompanyQuery("");
                          }}
                          className="shrink-0 rounded p-1 hover:bg-surface transition-colors"
                          aria-label="Effacer"
                        >
                          <X className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          ref={companyInputRef}
                          type="text"
                          value={companyQuery}
                          onChange={(e) => {
                            setCompanyQuery(e.target.value);
                            update("name", e.target.value);
                            setCompanyOpen(true);
                          }}
                          onFocus={() => setCompanyOpen(true)}
                          placeholder="Acme Industries…"
                          className={cn(inputCls, "pr-8")}
                          autoFocus
                        />
                        {companyLoading && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    )}
                  </div>
                  {matchingLeadsForName.length > 0 && (
                    <p className="mt-1 text-[10px] text-primary inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {matchingLeadsForName.length} contact{matchingLeadsForName.length > 1 ? "s" : ""}{" "}
                      déjà lié{matchingLeadsForName.length > 1 ? "s" : ""} à ce nom
                    </p>
                  )}
                </Field>

                <Field label="Domaine" icon={Globe}>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => update("domain", e.target.value)}
                    placeholder="entreprise.com"
                    className={inputCls}
                  />
                </Field>

                <Field label="Industrie" required>
                  <SearchSelect
                    value={form.industry}
                    onChange={(v) => update("industry", v)}
                    options={INDUSTRY_OPTIONS}
                    placeholder="Sélectionner un secteur…"
                    searchPlaceholder="SaaS, santé, logistique…"
                    title="Secteurs disponibles"
                    allowCustom
                  />
                </Field>

                <Field label="Localisation" icon={MapPin}>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Paris, FR"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="section-atelier p-4 md:p-6">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <DollarSign className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base md:text-lg">
                    Chiffres clés
                  </h2>
                </div>
                <span className="counter-pill shrink-0">
                  {[String(form.employees), form.revenue, form.size].filter((v) => v && v !== "")
                    .length}
                  /3
                </span>
              </div>

              <div className="space-y-4">
                <Field label="Effectif" icon={Users}>
                  <input
                    type="number"
                    value={form.employees}
                    onChange={(e) => update("employees", e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputCls}
                  />
                </Field>

                <Field label="Tranche de taille" icon={Layers}>
                  <SearchSelect
                    value={form.size}
                    onChange={(v) => update("size", v)}
                    options={SIZE_OPTIONS}
                    placeholder="Sélectionner une tranche…"
                    searchPlaceholder="PME, ETI, 500…"
                    title="Tranches de taille"
                    allowClear
                  />
                </Field>

                <Field label="Chiffre d'affaires" icon={DollarSign}>
                  <input
                    type="text"
                    value={form.revenue}
                    onChange={(e) => update("revenue", e.target.value)}
                    placeholder="12M€, 150M$..."
                    className={inputCls}
                  />
                </Field>

                <Field label="Intention d'achat" icon={Target}>
                  <SearchSelect
                    value={form.intent}
                    onChange={(v) => update("intent", v as FormData["intent"])}
                    options={INTENT_OPTIONS}
                    placeholder="Sélectionner…"
                    searchPlaceholder="Chaude, tiède…"
                    title="Niveau d'intention"
                  />
                </Field>
              </div>
            </section>

            <section className="section-atelier p-4 md:p-6">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-4 rounded-lg -mx-2 px-2 py-1 hover:bg-surface/40 transition-colors"
              >
                <div className="text-left">
                  <h3 className="text-sm font-semibold">Options avancées</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Enrichissement, attribution, tags et contexte commercial.
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform shrink-0",
                    advancedOpen && "rotate-180",
                  )}
                />
              </button>

              {advancedOpen && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <Field label="LinkedIn" icon={Linkedin}>
                    <input
                      type="text"
                      value={form.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      placeholder="linkedin.com/company/..."
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Année de création" icon={Calendar}>
                    <input
                      type="text"
                      value={form.founded}
                      onChange={(e) => update("founded", e.target.value)}
                      placeholder="1998"
                      className={inputCls}
                    />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Propriétaire du compte" icon={UserCog}>
                      <SearchSelect
                        value={form.owner}
                        onChange={(v) => update("owner", v)}
                        options={OWNER_OPTIONS}
                        placeholder="Sélectionner…"
                        searchPlaceholder="Sales, moi…"
                        title="Attribution du compte"
                      />
                    </Field>

                    <Field label="Source" icon={Compass}>
                      <SearchSelect
                        value={form.source}
                        onChange={(v) => update("source", v)}
                        options={SOURCE_OPTIONS}
                        placeholder="Sélectionner…"
                        searchPlaceholder="LinkedIn, import…"
                        title="Origine du compte"
                      />
                    </Field>
                  </div>

                  <Field label="Stack technique" icon={Tag}>
                    <input
                      type="text"
                      value={form.techStack}
                      onChange={(e) => update("techStack", e.target.value)}
                      placeholder="HubSpot, AWS, Segment..."
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Tags" icon={Tag}>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => update("tags", e.target.value)}
                      placeholder="ICP, croissance, outbound"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Description / contexte">
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      rows={4}
                      placeholder="Activité, enjeux, signaux détectés..."
                      className={cn(inputCls, "resize-y")}
                    />
                  </Field>

                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.autoEnrich}
                        onChange={(e) => update("autoEnrich", e.target.checked)}
                        className="mt-0.5 size-4 accent-current"
                      />
                      <span>
                        <span className="block text-xs font-medium">
                          Enrichissement automatique
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          Complète effectif, CA et contacts clés après création.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.saved}
                        onChange={(e) => update("saved", e.target.checked)}
                        className="mt-0.5 size-4 accent-current"
                      />
                      <span>
                        <span className="block text-xs font-medium">Ajouter aux favoris</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          L'entreprise apparaîtra dans vos comptes sauvegardés.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-4 space-y-4">
            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Aperçu</h2>
                </div>
                <span className="counter-pill counter-pill--sm">{completionPercent}%</span>
              </div>
              <LivePreviewCard form={form} />
            </section>

            <section className="section-atelier p-4">
              <div className="section-atelier__head">
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                  <h2 className="section-atelier__title truncate text-base">Progression</h2>
                </div>
                <span className="counter-pill counter-pill--sm">
                  {requiredFilled + optionalFilled}/11
                </span>
              </div>
              <ul className="space-y-2">
                <ProgressRow label="Obligatoires" value={requiredFilled} max={3} />
                <ProgressRow label="Optionnels" value={optionalFilled} max={optionalTotal} />
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
                    <b className="text-foreground">nom, domaine et industrie</b> pour enregistrer.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="size-3 mt-0.5 shrink-0 text-primary" />
                  <span>Le nom est détecté automatiquement dans vos contacts existants.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="size-3 mt-0.5 shrink-0 text-primary" />
                  <span>L'intention d'achat aide l'IA à prioriser vos actions.</span>
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
                onClick={() => navigate({ to: "/app/companies" })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg bg-background hover:bg-surface transition-colors shadow-[0_2px_0_var(--border)] active:translate-y-[2px] active:shadow-none"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                title={!form.name.trim() ? "Le nom est requis" : undefined}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:translate-y-[2px] active:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Créer l'entreprise
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

            {companyLoading && companyResults.length === 0 && (
              <div className="p-4 text-center">
                <span className="mx-auto block size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!companyLoading &&
              userCompaniesFiltered.length === 0 &&
              companyResults.length === 0 && (
                <p className="px-3 py-5 text-center text-[11px] text-muted-foreground">
                  {companyQuery.trim()
                    ? "Aucune entreprise trouvée — le nom saisi sera conservé."
                    : "Tapez pour rechercher une entreprise"}
                </p>
              )}
          </div>,
          document.body,
        )}
    </div>
  );
}
