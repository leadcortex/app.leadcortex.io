//frontend\components\known-people.tsx
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MapPin,
  Building2,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Linkedin,
  Mail,
  Radio,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/company-logo";
import { ResizableSplit } from "@/components/resizable-split";
import { LetterAvatar } from "@/components/ui/letter-avatar";

export type KnownPerson = {
  id: string;
  name: string;
  title: string;
  company: string;
  companyDomain: string;
  industry: string;
  location: string;
  signal: string;
  score: number;
  email: string;
  linkedin: string;
  description: string;
};

export const KNOWN_PEOPLE: KnownPerson[] = [
  {
    id: "kp-sundar",
    name: "Sundar Pichai",
    title: "CEO",
    company: "Google",
    companyDomain: "google.com",
    industry: "Technology",
    location: "Mountain View, US",
    signal: "Lancement Gemini 3",
    score: 9.2,
    email: "sundar@google.com",
    linkedin: "linkedin.com/in/sundarpichai",
    description: "Direction de la stratégie IA et cloud d'Alphabet.",
  },
  {
    id: "kp-tim-cook",
    name: "Tim Cook",
    title: "CEO",
    company: "Apple",
    companyDomain: "apple.com",
    industry: "Technology",
    location: "Cupertino, US",
    signal: "Expansion Vision Pro",
    score: 9.0,
    email: "tcook@apple.com",
    linkedin: "linkedin.com/in/timcook",
    description: "Pilotage de la diversification services et wearable d'Apple.",
  },
  {
    id: "kp-satya",
    name: "Satya Nadella",
    title: "CEO",
    company: "Microsoft",
    companyDomain: "microsoft.com",
    industry: "Software",
    location: "Redmond, US",
    signal: "Investissement IA $80B",
    score: 9.3,
    email: "satya@microsoft.com",
    linkedin: "linkedin.com/in/satyanadella",
    description: "Stratégie cloud + IA générative (Azure OpenAI, Copilot).",
  },
  {
    id: "kp-andy-jassy",
    name: "Andy Jassy",
    title: "CEO",
    company: "Amazon",
    companyDomain: "amazon.com",
    industry: "Ecommerce",
    location: "Seattle, US",
    signal: "Expansion AWS Bedrock",
    score: 8.7,
    email: "ajassy@amazon.com",
    linkedin: "linkedin.com/in/andyjassy",
    description: "Transformation de la logistique et montée en puissance d'AWS.",
  },
  {
    id: "kp-zuck",
    name: "Mark Zuckerberg",
    title: "CEO",
    company: "Meta",
    companyDomain: "meta.com",
    industry: "Technology",
    location: "Menlo Park, US",
    signal: "Modèles Llama 4",
    score: 8.9,
    email: "zuck@meta.com",
    linkedin: "linkedin.com/in/zuck",
    description: "Pivot IA open source + réalité mixte.",
  },
  {
    id: "kp-altman",
    name: "Sam Altman",
    title: "CEO",
    company: "OpenAI",
    companyDomain: "openai.com",
    industry: "Technology",
    location: "San Francisco, US",
    signal: "Levée $6,6 Md",
    score: 9.6,
    email: "sam@openai.com",
    linkedin: "linkedin.com/in/samaltman",
    description: "Accélération du déploiement d'agents IA grand public.",
  },
  {
    id: "kp-jensen",
    name: "Jensen Huang",
    title: "CEO",
    company: "Nvidia",
    companyDomain: "nvidia.com",
    industry: "Technology",
    location: "Santa Clara, US",
    signal: "Blackwell Ultra",
    score: 9.5,
    email: "jensen@nvidia.com",
    linkedin: "linkedin.com/in/jenhsunhuang",
    description: "Fournisseur de référence du calcul IA (GPU, CUDA).",
  },
  {
    id: "kp-musk",
    name: "Elon Musk",
    title: "CEO",
    company: "Tesla",
    companyDomain: "tesla.com",
    industry: "Automotive",
    location: "Austin, US",
    signal: "Cybercab & FSD",
    score: 8.8,
    email: "elon@tesla.com",
    linkedin: "linkedin.com/in/elonmusk",
    description: "Véhicules électriques, robotaxi et stockage d'énergie.",
  },
  {
    id: "kp-dara",
    name: "Dara Khosrowshahi",
    title: "CEO",
    company: "Uber",
    companyDomain: "uber.com",
    industry: "Transport",
    location: "San Francisco, US",
    signal: "Partenariats robotaxi",
    score: 8.4,
    email: "dara@uber.com",
    linkedin: "linkedin.com/in/darakhosrowshahi",
    description: "Expansion mobilité + livraison + autonomie.",
  },
  {
    id: "kp-brian",
    name: "Brian Chesky",
    title: "CEO",
    company: "Airbnb",
    companyDomain: "airbnb.com",
    industry: "Hospitality",
    location: "San Francisco, US",
    signal: "Programme Icons",
    score: 8.5,
    email: "brian@airbnb.com",
    linkedin: "linkedin.com/in/brianchesky",
    description: "Repositionnement de la plateforme voyage premium.",
  },
  {
    id: "kp-patrick",
    name: "Patrick Collison",
    title: "CEO",
    company: "Stripe",
    companyDomain: "stripe.com",
    industry: "Finance",
    location: "San Francisco, US",
    signal: "Stripe Tax global",
    score: 8.6,
    email: "patrick@stripe.com",
    linkedin: "linkedin.com/in/patrickcollison",
    description: "Infrastructure de paiement pour l'économie numérique.",
  },
  {
    id: "kp-daniel-ek",
    name: "Daniel Ek",
    title: "CEO",
    company: "Spotify",
    companyDomain: "spotify.com",
    industry: "Media",
    location: "Stockholm, SE",
    signal: "Audiobooks Expansion",
    score: 8.3,
    email: "daniel@spotify.com",
    linkedin: "linkedin.com/in/danielek",
    description: "Audio (musique, podcast, livres) à l'échelle mondiale.",
  },
  {
    id: "kp-tobi",
    name: "Tobi Lütke",
    title: "CEO",
    company: "Shopify",
    companyDomain: "shopify.com",
    industry: "Ecommerce",
    location: "Ottawa, CA",
    signal: "Shopify Plus Enterprise",
    score: 8.2,
    email: "tobi@shopify.com",
    linkedin: "linkedin.com/in/tobi",
    description: "Plateforme commerce unifiée pour marchands ambitieux.",
  },
  {
    id: "kp-ivan",
    name: "Ivan Zhao",
    title: "CEO",
    company: "Notion",
    companyDomain: "notion.so",
    industry: "Software",
    location: "San Francisco, US",
    signal: "Notion AI 3.0",
    score: 8.7,
    email: "ivan@notion.so",
    linkedin: "linkedin.com/in/ivanzhao",
    description: "Workspace tout-en-un avec IA intégrée.",
  },
  {
    id: "kp-dylan",
    name: "Dylan Field",
    title: "CEO",
    company: "Figma",
    companyDomain: "figma.com",
    industry: "Software",
    location: "San Francisco, US",
    signal: "Figma Make",
    score: 8.9,
    email: "dylan@figma.com",
    linkedin: "linkedin.com/in/dylanfield",
    description: "Design collaboratif + génération IA de prototypes.",
  },
  {
    id: "kp-shantanu",
    name: "Shantanu Narayen",
    title: "CEO",
    company: "Adobe",
    companyDomain: "adobe.com",
    industry: "Software",
    location: "San Jose, US",
    signal: "Firefly Video",
    score: 8.1,
    email: "shantanu@adobe.com",
    linkedin: "linkedin.com/in/shantanunarayen",
    description: "Créativité assistée par IA dans Creative Cloud.",
  },
  {
    id: "kp-benioff",
    name: "Marc Benioff",
    title: "CEO",
    company: "Salesforce",
    companyDomain: "salesforce.com",
    industry: "Software",
    location: "San Francisco, US",
    signal: "Agentforce",
    score: 8.8,
    email: "marc@salesforce.com",
    linkedin: "linkedin.com/in/marcbenioff",
    description: "CRM + agents IA embarqués pour l'entreprise.",
  },
  {
    id: "kp-eric-yuan",
    name: "Eric Yuan",
    title: "CEO",
    company: "Zoom",
    companyDomain: "zoom.us",
    industry: "Software",
    location: "San Jose, US",
    signal: "AI Companion 2.0",
    score: 8.0,
    email: "eric@zoom.us",
    linkedin: "linkedin.com/in/ericsyuan",
    description: "Communications unifiées avec IA temps réel.",
  },
  {
    id: "kp-ryan",
    name: "Ryan Roslansky",
    title: "CEO",
    company: "LinkedIn",
    companyDomain: "linkedin.com",
    industry: "Technology",
    location: "Sunnyvale, US",
    signal: "AI Recruiter",
    score: 8.3,
    email: "ryan@linkedin.com",
    linkedin: "linkedin.com/in/ryanroslansky",
    description: "Recrutement + formation assistés par IA.",
  },
  {
    id: "kp-linda",
    name: "Linda Yaccarino",
    title: "CEO",
    company: "X",
    companyDomain: "x.com",
    industry: "Media",
    location: "San Francisco, US",
    signal: "X Money",
    score: 7.9,
    email: "linda@x.com",
    linkedin: "linkedin.com/in/lindayaccarino",
    description: "Super-app sociale (paiement, contenus, messagerie).",
  },
  {
    id: "kp-drew",
    name: "Drew Houston",
    title: "CEO",
    company: "Dropbox",
    companyDomain: "dropbox.com",
    industry: "Software",
    location: "San Francisco, US",
    signal: "Dash AI",
    score: 7.8,
    email: "drew@dropbox.com",
    linkedin: "linkedin.com/in/drewhouston",
    description: "Stockage cloud + assistant IA universel.",
  },
  {
    id: "kp-thomas",
    name: "Thomas Kurian",
    title: "CEO Google Cloud",
    company: "Google",
    companyDomain: "google.com",
    industry: "Technology",
    location: "Sunnyvale, US",
    signal: "Vertex AI Enterprise",
    score: 8.6,
    email: "thomas.kurian@google.com",
    linkedin: "linkedin.com/in/thomaskurian",
    description: "Cloud + IA générative pour les grandes entreprises.",
  },
  {
    id: "kp-greg",
    name: "Greg Brockman",
    title: "Président",
    company: "OpenAI",
    companyDomain: "openai.com",
    industry: "Technology",
    location: "San Francisco, US",
    signal: "o1 reasoning model",
    score: 8.9,
    email: "greg@openai.com",
    linkedin: "linkedin.com/in/thegdb",
    description: "Coordination des équipes produit et infrastructure.",
  },
  {
    id: "kp-stewart",
    name: "Stewart Butterfield",
    title: "Ex-CEO / Investisseur",
    company: "Slack",
    companyDomain: "slack.com",
    industry: "Software",
    location: "San Francisco, US",
    signal: "Business angel SaaS",
    score: 7.5,
    email: "stewart@slack.com",
    linkedin: "linkedin.com/in/stewartbutterfield",
    description: "Fondateur de Slack, investisseur early-stage SaaS.",
  },
];

const INITIAL_VISIBLE = 10;

const SUGGESTED_NAMES = [
  "Sam Altman",
  "Tim Cook",
  "Sundar Pichai",
  "Satya Nadella",
  "Elon Musk",
  "Jensen Huang",
  "Dylan Field",
  "Marc Benioff",
];

function PersonRow({
  person,
  active,
  onClick,
}: {
  person: KnownPerson;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors",
        active ? "bg-primary/5" : "hover:bg-surface/60",
      )}
    >
      <LetterAvatar name={person.name} size={36} shape="circle" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">{person.name}</span>
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              person.score >= 9
                ? "bg-primary"
                : person.score >= 8
                  ? "bg-amber-500"
                  : "bg-muted-foreground",
            )}
            title={`Score ${person.score.toFixed(1)}`}
          />
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
            {person.score.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{person.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <CompanyLogo
            name={person.company}
            domain={person.companyDomain}
            size={14}
            className="shrink-0"
          />
          <span className="truncate text-[10px] text-muted-foreground">{person.company}</span>
        </div>
      </div>
      <ChevronRight
        className={cn("size-3.5 shrink-0 text-muted-foreground/60", active && "text-primary")}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Aperçu                                                                    */
/* -------------------------------------------------------------------------- */

function PersonPreview({
  person,
  onAdd,
}: {
  person: KnownPerson | null;
  onAdd: (p: KnownPerson) => void;
}) {
  if (!person) {
    return (
      <div className="relative isolate h-full w-full overflow-hidden">
        <img
          src="/images/prospects.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.12] md:opacity-20"
        />
        <div className="relative z-10 grid h-full place-items-center bg-background/50 p-6 backdrop-blur-[1px]">
          <div className="max-w-xs text-center">
            <Sparkles className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Sélectionnez un décideur pour voir son aperçu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border p-4 md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          <LetterAvatar name={person.name} size={64} shape="circle" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg italic md:text-2xl">{person.name}</h2>
            <p className="mt-0.5 inline-flex items-center gap-1.5 truncate text-xs text-muted-foreground md:text-sm">
              <Briefcase className="size-3" /> {person.title}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <CompanyLogo
                name={person.company}
                domain={person.companyDomain}
                size={16}
                className="shrink-0"
              />
              <span className="truncate text-xs font-medium">{person.company}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={person.score >= 9 ? "primary" : person.score >= 8 ? "warning" : "muted"}>
                Score {person.score.toFixed(1)}
              </Badge>
              <Badge tone="muted">{person.industry}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 md:p-5">
        <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
          {person.description}
        </p>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <Stat icon={MapPin} label="Localisation" value={person.location} />
          <Stat icon={Building2} label="Entreprise" value={person.company} />
        </div>

        <div className="rounded-xl border border-border bg-background p-3 md:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Signal d'intérêt
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Radio className="size-3.5 text-primary shrink-0" />
            <span className="text-xs md:text-sm">{person.signal}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-3 md:p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contact probable
          </p>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Mail className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate font-mono">{person.email}</span>
          </div>
          <a
            href={`https://${person.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs md:text-sm text-primary hover:underline"
          >
            <Linkedin className="size-3.5 shrink-0" />
            <span className="truncate font-mono">{person.linkedin}</span>
          </a>
          <p className="text-[10px] text-muted-foreground">
            Coordonnées probables — à vérifier avant tout envoi.
          </p>
        </div>

        <div className="rounded-xl bg-primary/5 p-3 md:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
            Angle d'approche suggéré
          </p>
          <p className="mt-1 text-xs md:text-sm text-primary">
            {person.score >= 9
              ? `Signaux très forts : approche directe, personnalisée sur ${person.signal}.`
              : person.score >= 8
                ? `Intérêt modéré : entrer par la valeur métier (${person.signal}).`
                : `À surveiller : initier un premier contact sans pression.`}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-surface/30 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAdd(person)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[10px] text-background transition-opacity hover:opacity-90 md:text-xs"
          >
            <Plus className="size-3.5" /> Ajouter à ma base
          </button>
          <a
            href={`https://${person.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] transition-colors hover:bg-surface md:text-xs"
          >
            <Linkedin className="size-3.5" /> LinkedIn
          </a>
          <button
            type="button"
            onClick={() => toast.info(`Analyse IA de ${person.name} en cours…`)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] transition-colors hover:bg-surface md:text-xs"
          >
            <Sparkles className="size-3.5" /> Enrichir
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-medium md:text-sm">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Explorateur                                                               */
/* -------------------------------------------------------------------------- */

export function KnownPeopleExplorer() {
  const { addLead, addActivity } = useAppStore();

  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWN_PEOPLE;
    return KNOWN_PEOPLE.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [query]);

  const dropdownMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return filtered.slice(0, 8);
  }, [filtered, query]);

  const computeDropdownStyle = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const GAP = 6;
    const SIDE_WIDTH = 360;
    const MAX_HEIGHT = 340;

    const spaceBelow = vh - r.bottom - GAP - 8;
    const spaceRight = vw - r.right - GAP - 8;
    const spaceLeft = r.left - GAP - 8;

    if (spaceBelow >= 180) {
      setDropdownStyle({
        position: "fixed",
        top: r.bottom + GAP,
        left: r.left,
        width: r.width,
        maxHeight: Math.min(MAX_HEIGHT, spaceBelow),
        zIndex: 9999,
      });
      return;
    }

    if (spaceRight >= SIDE_WIDTH) {
      setDropdownStyle({
        position: "fixed",
        top: Math.max(8, Math.min(r.top, vh - MAX_HEIGHT - 8)),
        left: r.right + GAP,
        width: SIDE_WIDTH,
        maxHeight: Math.min(MAX_HEIGHT, vh - 16),
        zIndex: 9999,
      });
      return;
    }

    if (spaceLeft >= SIDE_WIDTH) {
      setDropdownStyle({
        position: "fixed",
        top: Math.max(8, Math.min(r.top, vh - MAX_HEIGHT - 8)),
        left: r.left - SIDE_WIDTH - GAP,
        width: SIDE_WIDTH,
        maxHeight: Math.min(MAX_HEIGHT, vh - 16),
        zIndex: 9999,
      });
      return;
    }

    setDropdownStyle({
      position: "fixed",
      top: r.bottom + GAP,
      left: Math.max(8, Math.min(r.left, vw - r.width - 8)),
      width: r.width,
      maxHeight: Math.max(120, spaceBelow),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    computeDropdownStyle();
    const h = () => computeDropdownStyle();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.removeEventListener("resize", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [dropdownOpen, computeDropdownStyle]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (inputRef.current?.contains(t)) return;
      if (t.closest?.("[data-known-people-dropdown]")) return;
      setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, filtered.length - INITIAL_VISIBLE);
  const selected = KNOWN_PEOPLE.find((p) => p.id === selectedId) ?? null;

  const handleAdd = (p: KnownPerson) => {
    try {
      const created = addLead({
        name: p.name,
        title: p.title,
        company: p.company,
        industry: p.industry,
        location: p.location,
        status: "queued",
        score: p.score,
        email: p.email,
        phone: undefined,
        signal: p.signal,
        stage: "new",
        saved: false,
      } as any);
      addActivity?.("Décideur importé", `${p.name} — ${p.company} (suggestion)`);
      if (created && typeof created === "object" && "id" in created) {
        toast.success(`${p.name} ajouté à votre base`);
      } else {
        toast.success(`${p.name} ajouté`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  };

  const leftPane = (
    <>
      <div className="shrink-0 border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAll(false);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Rechercher un décideur…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h3 className="truncate font-display text-sm italic">
          {query.trim() ? "Résultats" : "Décideurs connus"}
        </h3>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visible.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Aucun décideur ne correspond à votre recherche.
          </div>
        ) : (
          <>
            {visible.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                active={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
              />
            ))}

            {!showAll && hiddenCount > 0 && (
              <div className="border-t border-border/60 p-2">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  <ArrowRight className="size-3.5" /> Voir les {hiddenCount} autres
                </button>
              </div>
            )}

            {showAll && filtered.length > INITIAL_VISIBLE && (
              <div className="border-t border-border/60 p-2">
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  Réduire
                </button>
              </div>
            )}

            <div className="border-t border-border/60 px-3 py-2 text-center text-[10px] text-muted-foreground/70">
              Données publiques · à titre d'exemple
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <ResizableSplit
        left={leftPane}
        right={<PersonPreview person={selected} onAdd={handleAdd} />}
        defaultLeftWidth={340}
        minLeftWidth={220}
        maxLeftWidth={520}
        minRightWidth={260}
        desktopHeight={560}
        mobileLeftHeight={420}
        mobileRightHeight={460}
        resizerLabel="Redimensionner la liste des décideurs"
      />

      {dropdownOpen &&
        dropdownStyle &&
        createPortal(
          <div
            data-known-people-dropdown
            style={dropdownStyle}
            className="overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95"
          >
            {!query.trim() ? (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Recherches suggérées
                </p>
                {SUGGESTED_NAMES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(s);
                      inputRef.current?.focus();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-surface"
                  >
                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{s}</span>
                    <ArrowRight className="ml-auto size-3 shrink-0 text-muted-foreground/60" />
                  </button>
                ))}
              </>
            ) : dropdownMatches.length === 0 ? (
              <p className="px-3 py-5 text-center text-[11px] text-muted-foreground">
                Aucun décideur trouvé
              </p>
            ) : (
              dropdownMatches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSelectedId(p.id);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    selectedId === p.id ? "bg-primary/10" : "hover:bg-surface",
                  )}
                >
                  <LetterAvatar name={p.name} size={24} shape="circle" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{p.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {p.title} · {p.company}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {p.score.toFixed(1)}
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
