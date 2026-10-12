//frontend\routes\app.companies.new.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/ui-primitives";
import {
  ArrowLeft,
  Save,
  X,
  Sparkles,
  ChevronDown,
  Building2,
  Globe,
  MapPin,
  Users,
  Linkedin,
  Tag,
  Wand2,
  Check,
  DollarSign,
  Calendar,
  Layers,
  Target,
  UserCog,
  Compass,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { CreateFormSkeleton } from "@/components/skeletons";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";

export const Route = createFileRoute("/app/companies/new")({
  head: () => ({ meta: [{ title: "Nouvelle entreprise — LeadCortex" }] }),
  pendingComponent: () => <CreateFormSkeleton />,
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
};

const INDUSTRIES: SearchSelectOption[] = [
  { value: "Aerospace", label: "Aéronautique", description: "Constructeurs, MRO, sous-traitance" },
  { value: "Automotive", label: "Automobile", description: "OEM, équipementiers, mobilité" },
  { value: "Metallurgy", label: "Métallurgie", description: "Sidérurgie, fonderie, usinage" },
  { value: "Defense", label: "Défense", description: "Systèmes, sécurité, souveraineté" },
  { value: "Logistics", label: "Logistique", description: "Transport, supply chain, entrepôts" },
  { value: "Energy", label: "Énergie", description: "Renouvelable, nucléaire, réseaux" },
  { value: "Manufacturing", label: "Industrie", description: "Production, usines, process" },
  { value: "Electrical", label: "Électrique", description: "Composants, électronique, câblage" },
  { value: "Technology", label: "Technologie", description: "SaaS, éditeurs, ESN" },
  { value: "Software", label: "Logiciel / SaaS", description: "Éditeurs, plateformes, cloud" },
  { value: "Healthcare", label: "Santé", description: "Cliniques, medtech, pharma" },
  { value: "Pharmaceutical", label: "Pharmaceutique", description: "Laboratoires, biotech" },
  { value: "Finance", label: "Finance", description: "Banque, assurance, fintech" },
  { value: "Insurance", label: "Assurance", description: "Courtage, mutuelles, réassurance" },
  { value: "Banking", label: "Banque", description: "Banques de détail, BFI, néobanques" },
  { value: "Retail", label: "Retail", description: "Commerce, e-commerce, distribution" },
  { value: "Ecommerce", label: "E-commerce", description: "Marketplaces, D2C, dropshipping" },
  { value: "Construction", label: "Construction", description: "BTP, ingénierie, immobilier" },
  { value: "RealEstate", label: "Immobilier", description: "Promoteurs, gestion, proptech" },
  { value: "Consulting", label: "Conseil", description: "Stratégie, IT, RH, management" },
  { value: "Legal", label: "Juridique", description: "Cabinets d'avocats, legaltech" },
  { value: "Marketing", label: "Marketing / Publicité", description: "Agences, adtech, médias" },
  { value: "Media", label: "Média", description: "Presse, audiovisuel, streaming" },
  { value: "Telecom", label: "Télécom", description: "Opérateurs, réseaux, équipementiers" },
  { value: "Education", label: "Éducation", description: "Écoles, edtech, formation" },
  {
    value: "Hospitality",
    label: "Hôtellerie / Tourisme",
    description: "Hôtels, restauration, voyages",
  },
  { value: "Food", label: "Agroalimentaire", description: "Production, distribution, foodtech" },
  { value: "Agriculture", label: "Agriculture", description: "Agritech, coopératives, intrants" },
  { value: "Transport", label: "Transport", description: "Fret, passagers, mobilité" },
  { value: "Chemical", label: "Chimie", description: "Chimie fine, pétrochimie, matériaux" },
  { value: "Mining", label: "Mines & Carrières", description: "Extraction, minéraux, métaux" },
  { value: "Textile", label: "Textile", description: "Confection, mode, technique" },
  { value: "PublicSector", label: "Secteur public", description: "Administrations, collectivités" },
  { value: "NonProfit", label: "Association", description: "ONG, fondations, ESS" },
];

const SIZES: SearchSelectOption[] = [
  { value: "1-10", label: "1-10", description: "Très petite structure", group: "TPE / Startup" },
  { value: "11-50", label: "11-50", description: "Startup / PME", group: "TPE / Startup" },
  { value: "51-200", label: "51-200", description: "PME en croissance", group: "PME / ETI" },
  { value: "201-500", label: "201-500", description: "ETI", group: "PME / ETI" },
  { value: "500-1K", label: "500-1K", description: "Grande ETI", group: "PME / ETI" },
  { value: "1K-5K", label: "1K-5K", description: "Grand compte", group: "Grands comptes" },
  { value: "5K-10K", label: "5K-10K", description: "Groupe national", group: "Grands comptes" },
  { value: "10K+", label: "10K+", description: "Groupe international", group: "Grands comptes" },
];

const INTENTS: SearchSelectOption[] = [
  {
    value: "hot",
    label: "Forte intention",
    description: "Signaux d'achat récents, à contacter en priorité",
    keywords: "hot chaud forte",
  },
  {
    value: "warm",
    label: "Intention moyenne",
    description: "Intérêt latent, à nourrir",
    keywords: "warm tiede moyen",
  },
  {
    value: "cold",
    label: "Faible intention",
    description: "À surveiller, pas de signal",
    keywords: "cold froid faible",
  },
];

const SOURCES: SearchSelectOption[] = [
  {
    value: "manual",
    label: "Saisie manuelle",
    description: "Créé depuis cette fiche",
    group: "Direct",
  },
  {
    value: "import",
    label: "Import CSV / Excel",
    description: "Depuis un fichier",
    group: "Direct",
  },
  {
    value: "linkedin",
    label: "LinkedIn Sales Navigator",
    description: "Recherche Sales Nav",
    group: "Outbound",
  },
  {
    value: "website",
    label: "Visiteurs du site",
    description: "Détection de visite",
    group: "Inbound",
  },
  {
    value: "event",
    label: "Salon / événement",
    description: "Carte de visite scannée",
    group: "Terrain",
  },
  { value: "partner", label: "Partenaire", description: "Apport d'affaires", group: "Terrain" },
  { value: "referral", label: "Recommandation", description: "Bouche-à-oreille", group: "Terrain" },
];

const OWNERS: SearchSelectOption[] = [
  { value: "Moi", label: "Moi", description: "Compte personnel", group: "Utilisateurs" },
  {
    value: "Équipe Sales",
    label: "Équipe Sales",
    description: "Équipe commerciale",
    group: "Équipes",
  },
  {
    value: "Équipe Growth",
    label: "Équipe Growth",
    description: "Équipe croissance",
    group: "Équipes",
  },
  {
    value: "Équipe CS",
    label: "Équipe Customer Success",
    description: "Suivi client",
    group: "Équipes",
  },
  { value: "Non assigné", label: "Non assigné", description: "À attribuer", group: "Autres" },
];

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

function Field({
  label,
  required,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

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

function NewCompanyPage() {
  const navigate = useNavigate();
  const { addCompany, addActivity } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [aiOpening, setAiOpening] = useState(false);

  const [form, setForm] = useState<FormData>({
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
  });

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(e.target.name as keyof FormData, e.target.value as never);

  const completion = useMemo(() => {
    const fields = [
      form.name,
      form.domain,
      form.industry,
      form.location,
      String(form.employees),
      form.revenue,
      form.size,
      form.linkedin,
      form.description,
      form.tags,
    ];
    const filled = fields.filter((f) => f && f.trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const handleOpenAiAssistant = () => {
    setAiOpening(true);
    window.setTimeout(() => {
      openAssistant({ prompt: AI_PROMPT_TEMPLATE });
      setAiOpening(false);
      toast.success("Assistant IA ouvert", {
        description: "Complétez les balises du prompt pour générer la fiche.",
      });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    try {
      const created = addCompany({
        name: form.name.trim(),
        domain: form.domain.trim(),
        industry: form.industry || "Technology",
        location: form.location || "—",
        employees: Number(form.employees) || 0,
        revenue: form.revenue || "—",
        size: form.size || "—",
        intent: form.intent,
        saved: form.saved,
      });

      // Garde-fou : si le store ne renvoie pas d'id exploitable, on évite

      const newId =
        created && typeof created === "object" && "id" in created
          ? String((created as { id?: unknown }).id ?? "")
          : "";

      if (!newId) {
        console.error("[NewCompany] addCompany() n'a pas retourné d'id :", created);
        toast.error("Erreur : impossible de récupérer l'identifiant de l'entreprise créée.");
        setIsSubmitting(false);
        return;
      }

      addActivity("Entreprise créée", form.name);
      toast.success(`Entreprise ${form.name} créée avec succès`);

      // Petit tick pour laisser le store propager le nouvel élément avant
      // le rendu de la page détail (utile si un middleware de persistance
      // ou un subscriber asynchrone est branché sur le store).
      await new Promise((r) => setTimeout(r, 0));

      navigate({ to: "/app/companies/$id", params: { id: newId } });
    } catch (error: unknown) {
      console.error("[NewCompany] Erreur création :", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate({ to: "/app/companies" });

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="mt-1 p-1.5 rounded-md hover:bg-surface transition-colors"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <PageHeader
          eyebrow="Créer"
          title="Nouvelle entreprise"
          description="Ajoutez une entreprise cible à votre base de données."
          actions={
            <>
              <button
                type="button"
                onClick={handleOpenAiAssistant}
                disabled={aiOpening}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-60"
              >
                <Sparkles className="size-3.5" />
                {aiOpening ? "Ouverture…" : "Générer avec l'IA"}
              </button>
              <button
                type="button"
                onClick={() => toast.info("Ouvre le modal d'import CSV/Excel.")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-surface transition-colors"
              >
                Importer en masse
              </button>
            </>
          }
        />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface/40 px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Complétion de la fiche</span>
          <span className="font-mono font-medium">{completion}%</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-background p-5 md:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm">Informations générales</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Les champs marqués d'un * sont obligatoires.
              </p>
            </div>
            <Badge tone="muted">Étape 1 / 2</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nom de l'entreprise" required icon={Building2}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Entreprise SAS"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Domaine" required icon={Globe}>
              <input
                type="text"
                name="domain"
                value={form.domain}
                onChange={handleChange}
                placeholder="entreprise.com"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Industrie" required hint="Sélection dans le référentiel LeadCortex.">
              <SearchSelect
                value={form.industry}
                onChange={(v) => set("industry", v)}
                options={INDUSTRIES}
                placeholder="Sélectionner une industrie…"
                searchPlaceholder="Rechercher (ex : saas, santé, logistique)…"
                title="Secteurs disponibles"
                emptyMessage="Aucun secteur ne correspond."
                allowCustom
              />
            </Field>

            <Field label="Localisation" required icon={MapPin}>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Paris, FR"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Effectif" required icon={Users}>
              <input
                type="number"
                name="employees"
                value={form.employees}
                onChange={handleChange}
                placeholder="0"
                min="0"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Tranche de taille" icon={Layers}>
              <SearchSelect
                value={form.size}
                onChange={(v) => set("size", v)}
                options={SIZES}
                placeholder="Sélectionner une tranche…"
                searchPlaceholder="Rechercher (ex : pme, eti, 500)…"
                title="Tranches de taille"
                allowClear
              />
            </Field>

            <Field label="Chiffre d'affaires" icon={DollarSign}>
              <input
                type="text"
                name="revenue"
                value={form.revenue}
                onChange={handleChange}
                placeholder="12M€, 150M$..."
                className={inputCls}
              />
            </Field>

            <Field label="Intention d'achat" icon={Target}>
              <SearchSelect
                value={form.intent}
                onChange={(v) => set("intent", v as FormData["intent"])}
                options={INTENTS}
                placeholder="Sélectionner…"
                searchPlaceholder="Rechercher (ex : chaude, tiède)…"
                title="Niveau d'intention"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background overflow-visible">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 md:px-6 py-4 hover:bg-surface/60 transition-colors rounded-t-xl"
          >
            <span className="text-left">
              <span className="block font-semibold text-sm">Options avancées</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Enrichissement, attribution, tags et contexte commercial.
              </span>
            </span>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            />
          </button>

          {advancedOpen && (
            <div className="border-t border-border px-5 md:px-6 py-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="LinkedIn" icon={Linkedin}>
                  <input
                    type="text"
                    name="linkedin"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="linkedin.com/company/..."
                    className={inputCls}
                  />
                </Field>

                <Field label="Année de création" icon={Calendar}>
                  <input
                    type="text"
                    name="founded"
                    value={form.founded}
                    onChange={handleChange}
                    placeholder="1998"
                    className={inputCls}
                  />
                </Field>

                <Field label="Propriétaire du compte" icon={UserCog}>
                  <SearchSelect
                    value={form.owner}
                    onChange={(v) => set("owner", v)}
                    options={OWNERS}
                    placeholder="Sélectionner un propriétaire…"
                    searchPlaceholder="Rechercher (ex : sales, moi)…"
                    title="Attribution du compte"
                  />
                </Field>

                <Field label="Source" icon={Compass}>
                  <SearchSelect
                    value={form.source}
                    onChange={(v) => set("source", v)}
                    options={SOURCES}
                    placeholder="Sélectionner une source…"
                    searchPlaceholder="Rechercher (ex : linkedin, import)…"
                    title="Origine du compte"
                  />
                </Field>

                <Field label="Stack technique" icon={Tag}>
                  <input
                    type="text"
                    name="techStack"
                    value={form.techStack}
                    onChange={handleChange}
                    placeholder="HubSpot, AWS, Segment..."
                    className={inputCls}
                  />
                </Field>

                <Field label="Tags" hint="Séparez par des virgules.">
                  <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="ICP, croissance, outbound"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Description / contexte">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Activité, enjeux, signaux détectés..."
                  className={`${inputCls} resize-y`}
                />
              </Field>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.autoEnrich}
                    onChange={(e) => set("autoEnrich", e.target.checked)}
                    className="mt-0.5 size-4 accent-current"
                  />
                  <span>
                    <span className="block text-xs font-medium">Enrichissement automatique</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      Complète effectif, CA et contacts clés après création.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.saved}
                    onChange={(e) => set("saved", e.target.checked)}
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
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleOpenAiAssistant}
            disabled={aiOpening}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-60"
          >
            <Wand2 className="size-4" /> Compléter avec l'IA
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
            >
              <X className="size-4" /> Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="size-4" /> Créer l'entreprise
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
          <Check className="size-3" /> Données simulées : aucune information n'est envoyée à un
          service externe.
        </p>
      </form>
    </div>
  );
}
