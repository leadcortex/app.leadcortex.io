//frontend\routes\app.people.new.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  User as UserIcon,
  Briefcase,
  Building2,
  Mail,
  Phone as PhoneIcon,
  Linkedin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  MapPin,
  Globe,
  Tag,
  Radio,
  Gauge,
  StickyNote,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { CreateFormSkeleton } from "@/components/skeletons";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import {
  COUNTRY_CODES,
  REGION_ORDER,
  flagFromIso,
  getCountryByIso,
} from "@/components/ai-assistant/country-codes";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";
import { CompanyLogo } from "@/components/company-logo";
import { searchCompanies, type CompanyResult, guessDomainFromName } from "@/lib/company-database";
import { cn } from "@/lib/utils";

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
};

const INDUSTRIES = [
  "Aerospace",
  "Automotive",
  "Metallurgy",
  "Defense",
  "Logistics",
  "Energy",
  "Manufacturing",
  "Electrical",
  "Technology",
  "Software / SaaS",
  "Healthcare",
  "Pharmaceutical",
  "Finance",
  "Insurance",
  "Banking",
  "Retail",
  "E-commerce",
  "Construction",
  "Real Estate",
  "Consulting",
  "Legal",
  "Marketing / Ads",
  "Media",
  "Telecom",
  "Education",
  "Hospitality",
  "Food & Beverage",
  "Agriculture",
  "Transportation",
  "Chemical",
  "Mining",
  "Textile",
  "Public sector",
  "Non-profit",
];

const STAGE_OPTIONS: SearchSelectOption[] = [
  { value: "new", label: "Nouveau", description: "Pas encore contacté" },
  { value: "contacted", label: "Contacté", description: "Premier message envoyé" },
  { value: "replied", label: "Répondu", description: "A répondu à un email" },
  { value: "meeting", label: "Rendez-vous", description: "Meeting planifié" },
  { value: "won", label: "Gagné", description: "Client signé" },
  { value: "lost", label: "Perdu", description: "Opportunité fermée" },
];

const SIGNAL_OPTIONS = [
  "Levée de fonds",
  "Recrutement en cours",
  "Nouveau produit / lancement",
  "Expansion internationale",
  "Changement de poste",
  "Acquisition / fusion",
  "Ouverture de bureau",
  "Croissance du chiffre d'affaires",
  "Nouveau dirigeant",
  "Partenariat annoncé",
  "Investissement R&D",
];

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

/* -------------------------------------------------------------------------- */
/*  Constantes UI                                                             */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { id: 1, label: "L'essentiel" },
  { id: 2, label: "Coordonnées" },
  { id: 3, label: "Qualification" },
];

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function NewPeoplePage() {
  const navigate = useNavigate();
  const { addActivity, addLead, companies } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<FormData>(emptyForm);

  /* --- Entreprise : autocomplétion --- */
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

  /* --- Recherche API avec debounce --- */
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

  /* --- Mes entreprises (filtrées) --- */
  const userCompaniesFiltered = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies.slice(0, 5);
    return companies
      .filter((c) => c.name.toLowerCase().includes(q) || (c.domain ?? "").toLowerCase().includes(q))
      .slice(0, 6);
  }, [companies, companyQuery]);

  const hasAnyResult = userCompaniesFiltered.length > 0 || companyResults.length > 0;

  /* --- Position du dropdown (au-dessus) --- */
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

  /* --- Fermeture clic extérieur / Escape --- */
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

  /* --- Sélection --- */
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

  /* ------------------------------ IA ------------------------------ */
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

  /* --- Validation --- */
  const canGoStep2 = form.name.trim() && form.title.trim() && form.company.trim();

  const handleNext = () => {
    if (step === 1 && !canGoStep2) {
      toast.error("Remplissez nom, poste et entreprise");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  /* --- Submit --- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGoStep2) {
      toast.error("Remplissez les champs obligatoires");
      setStep(1);
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
        company: form.company.trim(),
        industry: form.industry || "—",
        location: form.location || "—",
        status: "queued",
        score: form.score ? Number(form.score) : null,
        email: form.email || undefined,
        phone: fullPhone,
        signal: form.signal || undefined,
        stage: (form.stage as any) || "new",
        saved: false,
      });

      addActivity("Prospect créé", `${form.name} — ${form.company}`);
      toast.success(`Prospect ${form.name} créé`);
      navigate({ to: "/app/people/$id", params: { id: created.id } });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------ Rendu --------------------------- */
  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate({ to: "/app/people" })}
          className="p-1.5 rounded-md hover:bg-surface transition-colors"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl italic">Nouveau prospect</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Trois étapes rapides. Vous pourrez compléter plus tard.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAiAssistant}
          disabled={isGenerating}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/15 transition-colors disabled:opacity-50"
        >
          <Sparkles className="size-3.5" />
          {isGenerating ? "…" : "IA"}
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={cn(
                    "size-6 md:size-7 shrink-0 rounded-full grid place-items-center text-[10px] md:text-xs font-semibold transition-colors",
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" /> : s.id}
                </span>
                <span
                  className={cn(
                    "truncate text-[11px] md:text-xs font-medium hidden sm:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-1 md:mx-2 h-px flex-1 transition-colors",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <div className="rounded-xl border border-border bg-background p-4 md:p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-sm">L'essentiel</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Qui est ce prospect et où travaille-t-il ?
              </p>
            </div>

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
                placeholder="CTO, Head of Ops…"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Entreprise" required icon={Building2}>
              <div className="relative">
                {!companyOpen && form.company ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyQuery(form.company);
                      setCompanyOpen(true);
                    }}
                    className={cn(inputCls, "flex items-center gap-2 text-left")}
                  >
                    <CompanyLogo
                      name={form.company}
                      domain={form.companyDomain || undefined}
                      size={20}
                      className="shrink-0"
                    />
                    <span className="truncate">{form.company}</span>
                    {form.industry && (
                      <span className="ml-auto shrink-0 truncate text-[10px] text-muted-foreground">
                        {form.industry}
                      </span>
                    )}
                  </button>
                ) : (
                  <>
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
                        placeholder="Rechercher une entreprise…"
                        className={cn(inputCls, "pl-9 pr-8")}
                        autoFocus
                      />
                      {companyLoading && (
                        <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </>
                )}
              </div>
            </Field>

            <Field label="Secteur">
              <SearchSelect
                value={form.industry}
                onChange={(v) => update("industry", v)}
                options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                placeholder="Sélectionner un secteur…"
                searchPlaceholder="Rechercher (ex : saas, finance)…"
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
                placeholder="Paris, FR"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-border bg-background p-4 md:p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-sm">Coordonnées</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comment allez-vous contacter ce prospect ? Tout est optionnel.
              </p>
            </div>

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
                      <span className="flex h-[38px] items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm hover:border-primary/40">
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
                placeholder="https://entreprise.fr"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-border bg-background p-4 md:p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-sm">Qualification</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aidez l'IA à prioriser. Tout est optionnel.
              </p>
            </div>

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
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.score}
                  onChange={(e) => update("score", e.target.value)}
                  placeholder="8.5"
                  className={cn(inputCls, "font-mono")}
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
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={step === 1 ? () => navigate({ to: "/app/people" }) : handlePrev}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            {step === 1 ? (
              <>Annuler</>
            ) : (
              <>
                <ChevronLeft className="size-4" /> Retour
              </>
            )}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !canGoStep2}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continuer <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
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
          )}
        </div>

        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
          <Check className="size-3" /> Données simulées : aucune information n'est envoyée à un
          service externe (hors recherche d'entreprise publique).
        </p>
      </form>

      {companyOpen &&
        companyDropdownStyle &&
        createPortal(
          <div
            data-company-dropdown
            style={companyDropdownStyle}
            className="overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover shadow-2xl"
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
                  ? "Aucune entreprise trouvée"
                  : "Tapez pour rechercher une entreprise"}
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field helper                                                              */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
