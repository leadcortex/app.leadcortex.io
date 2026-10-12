//frontend\data\workflow-blocks-catalog.tsx
import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Rss,
  MousePointerClick,
  UserPlus,
  CalendarCheck,
  Search,
  UserSearch,
  Building2,
  Globe2,
  Radar,
  ScanSearch,
  Sparkles,
  DatabaseZap,
  FileSearch,
  Fingerprint,
  Network,
  Target,
  GaugeCircle,
  ListChecks,
  Percent,
  Award,
  BrainCircuit,
  Bot,
  Wand2,
  MessageSquare,
  Cpu,
  GitBranch,
  GitFork,
  Split,
  Filter,
  Shuffle,
  Repeat,
  RotateCw,
  ListOrdered,
  Layers,
  SkipForward,
  Variable,
  Braces,
  Hash,
  Type,
  ToggleLeft,
  Clock,
  Timer,
  AlarmClock,
  CalendarClock,
  Pause,
  CalendarDays,
  CalendarX,
  Users,
  Video,
  PhoneOutgoing,
  Building,
  Handshake,
  Briefcase,
  Contact,
  UserCog,
  Mail,
  MailCheck,
  MailOpen,
  Send,
  Reply,
  Linkedin,
  ThumbsUp,
  MessageCircle,
  UserCheck,
  Share2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  Voicemail,
  PhoneForwarded,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  FileOutput,
  Bell,
  BellRing,
  BellPlus,
  Flame,
  Star,
  Webhook,
  PlugZap,
  Link2,
  ExternalLink,
  Rocket,
  Code2,
  Terminal,
  Key,
  Lock,
  Braces as BracesIcon,
  Puzzle,
  Plug,
  Boxes,
  Component,
  Chrome,
  Wrench,
  SlidersHorizontal,
  Copy,
  Edit3,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Table2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Blocks,
  CircleDot,
  Workflow,
  Star as StarIcon,
  Beaker,
  StickyNote,
  FolderKanban,
  Tag,
  MessagesSquare,
  Highlighter,
  CircleStop,
  Flag,
  OctagonX,
  Mic,
  MailX,
} from "lucide-react";
import { CODE_LANGUAGE_LABELS } from "@/lib/workflow/code-languages";

export type ConfigFieldType =
  "text" | "textarea" | "select" | "number" | "toggle" | "code" | "tags";

export type ConfigField = {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: string[];
  placeholder?: string;
  defaultValue?: string | number | boolean;
  help?: string;
};

export type CategoryKey =
  | "trigger"
  | "search"
  | "enrichment"
  | "qualification"
  | "ai"
  | "condition"
  | "loop"
  | "variable"
  | "delay"
  | "meeting"
  | "crm"
  | "email"
  | "linkedin"
  | "phone"
  | "export"
  | "notification"
  | "webhook"
  | "api"
  | "integration"
  | "utility"
  | "report"
  | "error"
  | "end"
  | "organisation"
  | "custom";

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  color: string;
  icon: LucideIcon;
  description: string;
};

export type BlockBranch = { id: string; label: string };

export type BlockDef = {
  id: string;
  category: CategoryKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tags?: string[];
  branches?: BlockBranch[];
  inputs?: BlockBranch[];
  dynamicInputs?: boolean;
  noteField?: string;
  inlineLimit?: number;
  /**
   * Bloc terminal : n'a jamais de port de sortie, quelle que soit sa
   * catégorie. Utilisé pour les blocs de fin (« Fin d'automatisation »,
   * « Fin de branche »…) qui reçoivent bien une entrée mais ne peuvent
   * rien enchaîner derrière eux — contrairement aux déclencheurs/blocs
   * d'organisation, ils gardent leurs ports d'entrée normaux.
   */
  terminal?: boolean;
  configFields: ConfigField[];
};

export const CATEGORIES: CategoryDef[] = [
  {
    key: "trigger",
    label: "Déclencheurs",
    color: "#10b981",
    icon: Zap,
    description: "Ce qui démarre le workflow",
  },
  {
    key: "search",
    label: "Recherche de prospects",
    color: "#3b82f6",
    icon: Search,
    description: "Trouver de nouveaux leads",
  },
  {
    key: "enrichment",
    label: "Enrichissement de données",
    color: "#6366f1",
    icon: DatabaseZap,
    description: "Compléter les fiches leads",
  },
  {
    key: "qualification",
    label: "Qualification des leads",
    color: "#f59e0b",
    icon: Target,
    description: "Scorer et trier les leads",
  },
  {
    key: "ai",
    label: "IA & Analyse",
    color: "#a855f7",
    icon: BrainCircuit,
    description: "Intelligence artificielle générative",
  },
  {
    key: "condition",
    label: "Conditions & Logique",
    color: "#f97316",
    icon: GitBranch,
    description: "Aiguiller le flux",
  },
  {
    key: "loop",
    label: "Boucles & Itérations",
    color: "#06b6d4",
    icon: Repeat,
    description: "Répéter sur des listes",
  },
  {
    key: "variable",
    label: "Variables",
    color: "#64748b",
    icon: Variable,
    description: "Stocker et transformer des valeurs",
  },
  {
    key: "delay",
    label: "Délais & Planification",
    color: "#ec4899",
    icon: Clock,
    description: "Temporiser ou planifier",
  },
  {
    key: "meeting",
    label: "Réunions & Calendrier",
    color: "#d946ef",
    icon: CalendarDays,
    description: "Rendez-vous et disponibilités",
  },
  {
    key: "crm",
    label: "CRM",
    color: "#14b8a6",
    icon: Building2,
    description: "Comptes, contacts, pipeline",
  },
  {
    key: "email",
    label: "Emails",
    color: "#0ea5e9",
    icon: Mail,
    description: "Envoi et suivi d'emails",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    icon: Linkedin,
    description: "Prospection sociale",
  },
  { key: "phone", label: "Téléphone", color: "#22c55e", icon: Phone, description: "Appels et SMS" },
  {
    key: "export",
    label: "Export",
    color: "#65a30d",
    icon: Download,
    description: "Exporter les données",
  },
  {
    key: "notification",
    label: "Notifications",
    color: "#f43f5e",
    icon: Bell,
    description: "Alertes internes",
  },
  {
    key: "webhook",
    label: "Webhooks",
    color: "#8b5cf6",
    icon: Webhook,
    description: "Entrées / sorties HTTP",
  },
  { key: "api", label: "API", color: "#52525b", icon: Code2, description: "Appels API génériques" },
  {
    key: "integration",
    label: "Intégrations",
    color: "#ca8a04",
    icon: Puzzle,
    description: "Outils tiers connectés",
  },
  {
    key: "utility",
    label: "Utilitaires",
    color: "#6b7280",
    icon: Wrench,
    description: "Fonctions transverses",
  },
  {
    key: "report",
    label: "Rapports",
    color: "#78716c",
    icon: BarChart3,
    description: "Analytique et reporting",
  },
  {
    key: "error",
    label: "Gestion des erreurs",
    color: "#dc2626",
    icon: AlertTriangle,
    description: "Robustesse du flux",
  },
  {
    key: "end",
    label: "Fin d'automatisation",
    color: "#b91c1c",
    icon: CircleStop,
    description: "Arrête le workflow ou une branche",
  },
  {
    key: "organisation",
    label: "Organisation",
    color: "#eab308",
    icon: StickyNote,
    description: "Structurer le canevas (sans automatisation)",
  },
  {
    key: "custom",
    label: "Blocs personnalisés",
    color: "#a3a3a3",
    icon: Blocks,
    description: "Créés par vous",
  },
];

const bool = (v: boolean): boolean => v;

export const BLOCKS: BlockDef[] = [
  {
    id: "trig-webhook",
    category: "trigger",
    title: "Webhook reçu",
    subtitle: "Déclenché par une requête entrante",
    icon: Webhook,
    tags: ["Populaire"],
    configFields: [
      {
        key: "path",
        label: "Chemin du webhook",
        type: "text",
        placeholder: "/hooks/nouveau-lead",
        defaultValue: "/hooks/nouveau-lead",
      },
      {
        key: "method",
        label: "Méthode HTTP",
        type: "select",
        options: ["POST", "GET", "PUT"],
        defaultValue: "POST",
      },
      { key: "auth", label: "Authentification requise", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "trig-form",
    category: "trigger",
    title: "Formulaire soumis",
    subtitle: "Nouveau lead via formulaire web",
    icon: UserPlus,
    configFields: [
      {
        key: "formId",
        label: "Formulaire source",
        type: "select",
        options: ["Contact — page pricing", "Démo produit", "Newsletter", "Livre blanc IA"],
        defaultValue: "Démo produit",
      },
      { key: "dedupe", label: "Ignorer les doublons", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "trig-list",
    category: "trigger",
    title: "Ajout à une liste",
    subtitle: "Un lead entre dans une liste sauvegardée",
    icon: ListChecks,
    configFields: [
      {
        key: "listName",
        label: "Liste surveillée",
        type: "select",
        options: ["Comptes cibles Q3", "Leads chauds", "Import CSV manuel"],
        defaultValue: "Leads chauds",
      },
    ],
  },
  {
    id: "trig-schedule",
    category: "trigger",
    title: "Planification récurrente",
    subtitle: "Démarre à intervalle régulier",
    icon: CalendarClock,
    configFields: [
      {
        key: "frequency",
        label: "Fréquence",
        type: "select",
        options: ["Toutes les heures", "Chaque jour", "Chaque semaine", "Chaque mois"],
        defaultValue: "Chaque jour",
      },
      {
        key: "time",
        label: "Heure de déclenchement",
        type: "text",
        placeholder: "08:00",
        defaultValue: "08:00",
      },
    ],
  },
  {
    id: "trig-signal",
    category: "trigger",
    title: "Signal d'intention détecté",
    subtitle: "Ex : levée de fonds, recrutement",
    icon: Rss,
    tags: ["IA"],
    configFields: [
      {
        key: "signalType",
        label: "Type de signal",
        type: "select",
        options: [
          "Levée de fonds",
          "Recrutement actif",
          "Changement de poste",
          "Visite site web répétée",
        ],
        defaultValue: "Changement de poste",
      },
      { key: "minConfidence", label: "Confiance minimale", type: "number", defaultValue: 70 },
    ],
  },
  {
    id: "trig-manual",
    category: "trigger",
    title: "Déclenchement manuel",
    subtitle: "Lancé à la demande depuis l'app",
    icon: MousePointerClick,
    configFields: [
      { key: "confirm", label: "Demander confirmation", type: "toggle", defaultValue: bool(false) },
    ],
  },
  {
    id: "trig-meeting-booked",
    category: "trigger",
    title: "Rendez-vous réservé",
    subtitle: "Un prospect prend un créneau",
    icon: CalendarCheck,
    configFields: [
      {
        key: "calendarType",
        label: "Type de calendrier",
        type: "select",
        options: ["Démo commerciale", "Onboarding", "Renouvellement"],
        defaultValue: "Démo commerciale",
      },
    ],
  },
  {
    id: "trig-email-reply",
    category: "trigger",
    title: "Réponse email reçue",
    subtitle: "Déclenché dès qu'un prospect répond à une séquence",
    icon: Reply,
    tags: ["Populaire"],
    configFields: [
      {
        key: "sourceMailbox",
        label: "Boîte mail surveillée",
        type: "select",
        options: ["Commercial principal", "Support", "Noreply"],
        defaultValue: "Commercial principal",
      },
      {
        key: "priority",
        label: "Priorité du lead sortant",
        type: "select",
        options: ["Basse", "Haute (alerte immédiate)"],
        defaultValue: "Haute (alerte immédiate)",
      },
    ],
  },

  {
    id: "search-people",
    category: "search",
    title: "Rechercher des personnes",
    subtitle: "Filtrer par poste, séniorité, secteur",
    icon: UserSearch,
    tags: ["Populaire"],
    configFields: [
      {
        key: "jobTitles",
        label: "Intitulés de poste",
        type: "tags",
        placeholder: "VP Sales, Head of Growth",
        defaultValue: "VP Sales",
      },
      {
        key: "seniority",
        label: "Séniorité",
        type: "select",
        options: ["Toutes", "Manager+", "Director+", "VP+", "C-Level"],
        defaultValue: "Director+",
      },
      { key: "limit", label: "Nombre de résultats", type: "number", defaultValue: 100 },
    ],
  },
  {
    id: "search-company",
    category: "search",
    title: "Rechercher des entreprises",
    subtitle: "Filtrer par taille, secteur, techno",
    icon: Building2,
    configFields: [
      {
        key: "industry",
        label: "Secteur",
        type: "select",
        options: ["SaaS", "Fintech", "E-commerce", "Industrie", "Santé"],
        defaultValue: "SaaS",
      },
      {
        key: "headcount",
        label: "Taille d'entreprise",
        type: "select",
        options: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
        defaultValue: "51-200",
      },
    ],
  },
  {
    id: "search-lookalike",
    category: "search",
    title: "Comptes similaires",
    subtitle: "Basé sur vos meilleurs clients",
    icon: Radar,
    tags: ["IA"],
    configFields: [
      {
        key: "seedList",
        label: "Liste de référence",
        type: "select",
        options: ["Clients Top Tier", "Deals gagnés 2025"],
        defaultValue: "Clients Top Tier",
      },
      { key: "similarity", label: "Seuil de similarité", type: "number", defaultValue: 80 },
    ],
  },
  {
    id: "search-intent",
    category: "search",
    title: "Recherche par intention d'achat",
    subtitle: "Sociétés en phase de recherche active",
    icon: ScanSearch,
    configFields: [
      {
        key: "topic",
        label: "Thématique surveillée",
        type: "text",
        placeholder: "Outils de prospection IA",
        defaultValue: "Outils de prospection IA",
      },
      {
        key: "region",
        label: "Zone géographique",
        type: "select",
        options: ["France", "Europe", "Amérique du Nord", "Monde"],
        defaultValue: "Europe",
      },
    ],
  },
  {
    id: "search-domain",
    category: "search",
    title: "Explorer un domaine",
    subtitle: "Lister tous les contacts d'une entreprise",
    icon: Globe2,
    configFields: [
      { key: "domain", label: "Nom de domaine", type: "text", placeholder: "exemple.com" },
      {
        key: "departments",
        label: "Départements ciblés",
        type: "tags",
        placeholder: "Sales, Marketing",
      },
    ],
  },
  {
    id: "search-network",
    category: "search",
    title: "Explorer le réseau",
    subtitle: "2e/3e degré autour d'un contact",
    icon: Network,
    configFields: [
      {
        key: "sourceContact",
        label: "Contact source",
        type: "text",
        placeholder: "Nom du contact pivot",
      },
      {
        key: "degree",
        label: "Degré de relation",
        type: "select",
        options: ["1er degré", "2e degré", "3e degré"],
        defaultValue: "2e degré",
      },
    ],
  },
  {
    id: "search-news",
    category: "search",
    title: "Détecter des actualités clés",
    subtitle: "Levée de fonds, nomination, nouveau produit",
    icon: Rss,
    tags: ["Veille"],
    configFields: [
      {
        key: "signalType",
        label: "Type d'actualité",
        type: "select",
        options: ["Levée de fonds", "Nomination de dirigeant", "Lancement produit"],
        defaultValue: "Levée de fonds",
      },
      {
        key: "companiesList",
        label: "Liste des comptes à surveiller",
        type: "tags",
        placeholder: "Acme Corp, TechCorp",
      },
      { key: "lookbackDays", label: "Jours de rétrospective", type: "number", defaultValue: 7 },
    ],
  },

  {
    id: "enrich-contact",
    category: "enrichment",
    title: "Enrichir le contact",
    subtitle: "Email, téléphone, réseaux sociaux",
    icon: DatabaseZap,
    tags: ["Populaire"],
    configFields: [
      {
        key: "provider",
        label: "Fournisseur de données",
        type: "select",
        options: ["Base interne", "Apollo Data", "Clearbit-like", "Multi-sources"],
        defaultValue: "Multi-sources",
      },
      {
        key: "fields",
        label: "Champs à enrichir",
        type: "tags",
        placeholder: "email, téléphone, LinkedIn",
        defaultValue: "email, téléphone",
      },
    ],
  },
  {
    id: "enrich-company",
    category: "enrichment",
    title: "Enrichir l'entreprise",
    subtitle: "Effectif, levées, technologies utilisées",
    icon: FileSearch,
    configFields: [
      {
        key: "includeFunding",
        label: "Inclure données de levée",
        type: "toggle",
        defaultValue: bool(true),
      },
      {
        key: "includeTech",
        label: "Inclure stack technique",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "enrich-verify-email",
    category: "enrichment",
    title: "Vérifier l'email",
    subtitle: "Contrôle de délivrabilité",
    icon: MailCheck,
    configFields: [
      {
        key: "strictness",
        label: "Niveau de vérification",
        type: "select",
        options: ["Basique", "Standard", "Strict"],
        defaultValue: "Standard",
      },
      {
        key: "removeInvalid",
        label: "Retirer les emails invalides",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "enrich-social",
    category: "enrichment",
    title: "Récupérer profils sociaux",
    subtitle: "LinkedIn, X, GitHub",
    icon: Share2,
    configFields: [
      {
        key: "networks",
        label: "Réseaux ciblés",
        type: "tags",
        placeholder: "LinkedIn, X",
        defaultValue: "LinkedIn",
      },
    ],
  },
  {
    id: "enrich-firmographics",
    category: "enrichment",
    title: "Données firmographiques",
    subtitle: "CA estimé, croissance, marché",
    icon: Boxes,
    configFields: [
      {
        key: "revenueEstimate",
        label: "Estimer le chiffre d'affaires",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "enrich-fingerprint",
    category: "enrichment",
    title: "Identifier le visiteur anonyme",
    subtitle: "De-anonymisation du trafic web",
    icon: Fingerprint,
    tags: ["Beta"],
    configFields: [
      { key: "minPageviews", label: "Pages vues minimum", type: "number", defaultValue: 3 },
    ],
  },

  {
    id: "qual-score",
    category: "qualification",
    title: "Calculer le score du lead",
    subtitle: "Modèle de scoring pondéré",
    icon: GaugeCircle,
    tags: ["Populaire"],
    configFields: [
      {
        key: "model",
        label: "Modèle de score",
        type: "select",
        options: ["Fit + Intent", "Fit uniquement", "Intent uniquement", "Personnalisé"],
        defaultValue: "Fit + Intent",
      },
      { key: "threshold", label: "Seuil de qualification", type: "number", defaultValue: 60 },
    ],
  },
  {
    id: "qual-tier",
    category: "qualification",
    title: "Classer par tier",
    subtitle: "Répartir en segments A / B / C",
    icon: Award,
    branches: [
      { id: "a", label: "Tier A" },
      { id: "b", label: "Tier B" },
      { id: "c", label: "Tier C" },
    ],
    configFields: [
      { key: "tierAThreshold", label: "Seuil Tier A", type: "number", defaultValue: 80 },
      { key: "tierBThreshold", label: "Seuil Tier B", type: "number", defaultValue: 50 },
    ],
  },
  {
    id: "qual-icp-match",
    category: "qualification",
    title: "Comparer au profil client idéal",
    subtitle: "Similarité avec l'ICP défini",
    icon: Target,
    configFields: [
      {
        key: "icpProfile",
        label: "Profil ICP",
        type: "select",
        options: ["ICP Entreprise", "ICP Mid-Market", "ICP Startup"],
        defaultValue: "ICP Mid-Market",
      },
    ],
  },
  {
    id: "qual-budget",
    category: "qualification",
    title: "Vérifier le budget estimé",
    subtitle: "Filtrer selon la capacité d'achat",
    icon: Percent,
    configFields: [
      { key: "minBudget", label: "Budget minimum (€)", type: "number", defaultValue: 5000 },
    ],
  },
  {
    id: "qual-engagement",
    category: "qualification",
    title: "Évaluer l'engagement",
    subtitle: "Ouvertures, clics, visites répétées",
    icon: TrendingUp,
    configFields: [
      { key: "lookbackDays", label: "Fenêtre d'analyse (jours)", type: "number", defaultValue: 30 },
    ],
  },

  {
    id: "ai-summarize",
    category: "ai",
    title: "Résumer le profil",
    subtitle: "Synthèse IA du lead et de son contexte",
    icon: Sparkles,
    tags: ["IA", "Populaire"],
    configFields: [
      {
        key: "model",
        label: "Modèle IA",
        type: "select",
        options: ["Rapide", "Équilibré", "Approfondi"],
        defaultValue: "Équilibré",
      },
      { key: "maxLength", label: "Longueur max (mots)", type: "number", defaultValue: 120 },
    ],
  },
  {
    id: "ai-personalize",
    category: "ai",
    title: "Générer un message personnalisé",
    subtitle: "Rédaction IA basée sur le contexte du lead",
    icon: Wand2,
    tags: ["IA"],
    configFields: [
      {
        key: "tone",
        label: "Ton du message",
        type: "select",
        options: ["Direct", "Consultatif", "Décontracté", "Formel"],
        defaultValue: "Consultatif",
      },
      {
        key: "instructions",
        label: "Instructions spécifiques",
        type: "textarea",
        placeholder: "Mentionner leur levée de fonds récente...",
      },
    ],
  },
  {
    id: "ai-classify-intent",
    category: "ai",
    title: "Classifier l'intention",
    subtitle: "Détecter l'intérêt réel du prospect",
    icon: BrainCircuit,
    tags: ["IA"],
    configFields: [
      {
        key: "categories",
        label: "Catégories possibles",
        type: "tags",
        placeholder: "Intéressé, À relancer, Non pertinent",
        defaultValue: "Intéressé, À relancer, Non pertinent",
      },
    ],
  },
  {
    id: "ai-sentiment",
    category: "ai",
    title: "Analyser le sentiment",
    subtitle: "Positif, neutre ou négatif",
    icon: MessageSquare,
    branches: [
      { id: "positive", label: "Positif" },
      { id: "neutral", label: "Neutre" },
      { id: "negative", label: "Négatif" },
    ],
    configFields: [
      {
        key: "source",
        label: "Source analysée",
        type: "select",
        options: ["Dernière réponse email", "Transcript d'appel", "Message LinkedIn"],
        defaultValue: "Dernière réponse email",
      },
    ],
  },
  {
    id: "ai-agent",
    category: "ai",
    title: "Agent IA autonome",
    subtitle: "Prend des décisions multi-étapes",
    icon: Bot,
    tags: ["IA", "Beta"],
    inputs: [
      { id: "in", label: "Entrée" },
      { id: "context", label: "Contexte" },
      { id: "tools", label: "Outils" },
    ],
    dynamicInputs: true,
    noteField: "goal",
    inlineLimit: 4,
    configFields: [
      {
        key: "goal",
        label: "Objectif de l'agent",
        type: "textarea",
        placeholder: "Qualifier puis relancer les leads froids",
      },
      {
        key: "autonomy",
        label: "Niveau d'autonomie",
        type: "select",
        options: ["Suggestions uniquement", "Semi-autonome", "Totalement autonome"],
        defaultValue: "Semi-autonome",
      },
      {
        key: "model",
        label: "Modèle",
        type: "select",
        options: ["Rapide", "Équilibré", "Précision maximale"],
        defaultValue: "Équilibré",
      },
      { key: "maxSteps", label: "Étapes max", type: "number", defaultValue: 6 },
      { key: "temperature", label: "Créativité", type: "number", defaultValue: 0.4 },
      { key: "askHuman", label: "Validation humaine", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "ai-predict-churn",
    category: "ai",
    title: "Prédire le risque de désintérêt",
    subtitle: "Score de probabilité de perte",
    icon: Cpu,
    tags: ["IA"],
    configFields: [
      {
        key: "sensitivity",
        label: "Sensibilité du modèle",
        type: "select",
        options: ["Basse", "Moyenne", "Haute"],
        defaultValue: "Moyenne",
      },
    ],
  },
  {
    id: "ai-transcribe-call",
    category: "ai",
    title: "Analyser un appel vocal",
    subtitle: "Transcription et extraction des next-steps",
    icon: Mic,
    tags: ["IA", "Beta"],
    configFields: [
      {
        key: "language",
        label: "Langue de l'appel",
        type: "select",
        options: ["Français", "Anglais", "Espagnol"],
        defaultValue: "Français",
      },
      {
        key: "extractObjections",
        label: "Détecter les objections",
        type: "toggle",
        defaultValue: bool(true),
      },
      { key: "summaryLength", label: "Synthèse (mots)", type: "number", defaultValue: 80 },
    ],
  },

  {
    id: "cond-if-else",
    category: "condition",
    title: "Condition Si / Sinon",
    subtitle: "Aiguillage booléen simple",
    icon: Split,
    tags: ["Populaire"],
    branches: [
      { id: "true", label: "Vrai" },
      { id: "false", label: "Faux" },
    ],
    configFields: [
      { key: "field", label: "Champ à comparer", type: "text", placeholder: "lead.score" },
      {
        key: "operator",
        label: "Opérateur",
        type: "select",
        options: ["=", "≠", ">", "<", "contient", "existe"],
        defaultValue: ">",
      },
      { key: "value", label: "Valeur de comparaison", type: "text", placeholder: "50" },
    ],
  },
  {
    id: "cond-switch",
    category: "condition",
    title: "Aiguillage multiple (Switch)",
    subtitle: "Router selon plusieurs cas",
    icon: GitFork,
    branches: [
      { id: "case1", label: "Cas 1" },
      { id: "case2", label: "Cas 2" },
      { id: "case3", label: "Cas 3" },
      { id: "default", label: "Défaut" },
    ],
    configFields: [{ key: "field", label: "Champ évalué", type: "text", placeholder: "lead.pays" }],
  },
  {
    id: "cond-country-router",
    category: "condition",
    title: "Router par région",
    subtitle: "FR / US / Reste du monde",
    icon: Globe2,
    branches: [
      { id: "fr", label: "France" },
      { id: "us", label: "USA" },
      { id: "other", label: "Autre" },
    ],
    configFields: [
      {
        key: "field",
        label: "Champ pays",
        type: "text",
        placeholder: "company.country",
        defaultValue: "company.country",
      },
    ],
  },
  {
    id: "cond-filter",
    category: "condition",
    title: "Filtrer les leads",
    subtitle: "Ne garder que ceux qui correspondent",
    icon: Filter,
    configFields: [
      {
        key: "rules",
        label: "Règles de filtre",
        type: "textarea",
        placeholder: "score > 50 AND pays = France",
      },
      {
        key: "matchType",
        label: "Type de correspondance",
        type: "select",
        options: ["Toutes les règles", "Au moins une règle"],
        defaultValue: "Toutes les règles",
      },
    ],
  },
  {
    id: "cond-random-split",
    category: "condition",
    title: "Répartition A/B",
    subtitle: "Test aléatoire entre deux chemins",
    icon: Shuffle,
    branches: [
      { id: "a", label: "Variante A" },
      { id: "b", label: "Variante B" },
    ],
    configFields: [
      { key: "splitRatio", label: "Répartition A (%)", type: "number", defaultValue: 50 },
    ],
  },
  {
    id: "cond-dedupe",
    category: "condition",
    title: "Détecter les doublons",
    subtitle: "Comparer avec la base existante",
    icon: Copy,
    branches: [
      { id: "unique", label: "Nouveau" },
      { id: "duplicate", label: "Doublon" },
    ],
    configFields: [
      {
        key: "matchOn",
        label: "Comparer sur",
        type: "select",
        options: ["Email", "Domaine + Nom", "Téléphone"],
        defaultValue: "Email",
      },
    ],
  },

  {
    id: "loop-foreach",
    category: "loop",
    title: "Boucle pour chaque lead",
    subtitle: "Répéter les étapes suivantes",
    icon: Repeat,
    tags: ["Populaire"],
    configFields: [
      { key: "source", label: "Liste source", type: "text", placeholder: "resultats_recherche" },
      { key: "batchSize", label: "Taille de lot", type: "number", defaultValue: 10 },
    ],
  },
  {
    id: "loop-retry",
    category: "loop",
    title: "Répéter jusqu'à succès",
    subtitle: "Nouvelle tentative automatique",
    icon: RotateCw,
    configFields: [
      { key: "maxRetries", label: "Tentatives max", type: "number", defaultValue: 3 },
      { key: "backoff", label: "Délai entre tentatives (s)", type: "number", defaultValue: 30 },
    ],
  },
  {
    id: "loop-paginate",
    category: "loop",
    title: "Parcourir les pages de résultats",
    subtitle: "Pagination automatique d'une source",
    icon: ListOrdered,
    configFields: [
      { key: "pageSize", label: "Éléments par page", type: "number", defaultValue: 50 },
      { key: "maxPages", label: "Pages max", type: "number", defaultValue: 10 },
    ],
  },
  {
    id: "loop-batch",
    category: "loop",
    title: "Traiter par lots",
    subtitle: "Regrouper avant traitement",
    icon: Layers,
    configFields: [
      { key: "batchSize", label: "Taille du lot", type: "number", defaultValue: 25 },
      { key: "parallel", label: "Traitement parallèle", type: "toggle", defaultValue: bool(false) },
    ],
  },
  {
    id: "loop-break",
    category: "loop",
    title: "Sortir de la boucle",
    subtitle: "Interrompt l'itération sous condition",
    icon: SkipForward,
    configFields: [
      {
        key: "condition",
        label: "Condition de sortie",
        type: "text",
        placeholder: "leads_traités >= 100",
      },
    ],
  },

  {
    id: "var-set",
    category: "variable",
    title: "Définir une variable",
    subtitle: "Stocker une valeur pour réutilisation",
    icon: Variable,
    tags: ["Populaire"],
    configFields: [
      { key: "name", label: "Nom de la variable", type: "text", placeholder: "score_final" },
      { key: "value", label: "Valeur", type: "text", placeholder: "{{lead.score}} * 1.2" },
    ],
  },
  {
    id: "var-transform",
    category: "variable",
    title: "Transformer une valeur",
    subtitle: "Formatage, calcul, concaténation",
    icon: Braces,
    configFields: [
      {
        key: "expression",
        label: "Expression",
        type: "code",
        placeholder: "UPPER(lead.nom) + ' - ' + company.nom",
      },
    ],
  },
  {
    id: "var-counter",
    category: "variable",
    title: "Incrémenter un compteur",
    subtitle: "Suivre un nombre d'occurrences",
    icon: Hash,
    configFields: [
      {
        key: "counterName",
        label: "Nom du compteur",
        type: "text",
        placeholder: "relances_envoyees",
      },
      { key: "step", label: "Pas d'incrémentation", type: "number", defaultValue: 1 },
    ],
  },
  {
    id: "var-format-text",
    category: "variable",
    title: "Formater du texte",
    subtitle: "Casse, longueur, remplacement",
    icon: Type,
    configFields: [
      {
        key: "operation",
        label: "Opération",
        type: "select",
        options: ["Majuscules", "Minuscules", "Tronquer", "Remplacer"],
        defaultValue: "Tronquer",
      },
    ],
  },
  {
    id: "var-toggle-flag",
    category: "variable",
    title: "Activer un indicateur",
    subtitle: "Booléen de suivi interne",
    icon: ToggleLeft,
    configFields: [
      {
        key: "flagName",
        label: "Nom de l'indicateur",
        type: "text",
        placeholder: "est_prioritaire",
      },
      { key: "value", label: "Valeur", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "var-uuid",
    category: "variable",
    title: "Générer un identifiant unique (UUID)",
    subtitle: "Créer un tracking ID pour le lead",
    icon: Hash,
    configFields: [
      {
        key: "variableName",
        label: "Nom de la variable cible",
        type: "text",
        placeholder: "lead.tracking_id",
        defaultValue: "lead.tracking_id",
      },
      {
        key: "version",
        label: "Version UUID",
        type: "select",
        options: ["v4 (aléatoire)", "v7 (temporal)"],
        defaultValue: "v4 (aléatoire)",
      },
    ],
  },

  {
    id: "delay-wait",
    category: "delay",
    title: "Attendre une durée",
    subtitle: "Pause fixe avant de continuer",
    icon: Clock,
    tags: ["Populaire"],
    configFields: [
      { key: "duration", label: "Durée", type: "number", defaultValue: 2 },
      {
        key: "unit",
        label: "Unité",
        type: "select",
        options: ["Minutes", "Heures", "Jours"],
        defaultValue: "Jours",
      },
    ],
  },
  {
    id: "delay-until-date",
    category: "delay",
    title: "Attendre jusqu'à une date",
    subtitle: "Reprise à date/heure précise",
    icon: CalendarClock,
    configFields: [
      { key: "date", label: "Date cible", type: "text", placeholder: "2026-08-01" },
      { key: "time", label: "Heure cible", type: "text", placeholder: "09:00" },
    ],
  },
  {
    id: "delay-business-hours",
    category: "delay",
    title: "Reprendre en heures ouvrées",
    subtitle: "Respecter fuseau horaire et jours ouvrés",
    icon: Timer,
    configFields: [
      {
        key: "timezone",
        label: "Fuseau horaire",
        type: "select",
        options: ["Europe/Paris", "Europe/London", "America/New_York"],
        defaultValue: "Europe/Paris",
      },
      {
        key: "workdaysOnly",
        label: "Jours ouvrés uniquement",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "delay-snooze",
    category: "delay",
    title: "Reporter (snooze)",
    subtitle: "Repousser selon la réponse du lead",
    icon: AlarmClock,
    configFields: [
      {
        key: "reason",
        label: "Motif du report",
        type: "select",
        options: ["Pas maintenant", "Rappeler plus tard", "En congés"],
        defaultValue: "Rappeler plus tard",
      },
    ],
  },
  {
    id: "delay-pause",
    category: "delay",
    title: "Mettre en pause le workflow",
    subtitle: "Suspend jusqu'à reprise manuelle",
    icon: Pause,
    configFields: [
      {
        key: "notifyOnPause",
        label: "Notifier l'équipe",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },

  {
    id: "meeting-propose-slots",
    category: "meeting",
    title: "Proposer des créneaux",
    subtitle: "Envoyer les disponibilités au lead",
    icon: CalendarDays,
    tags: ["Populaire"],
    configFields: [
      {
        key: "calendarLink",
        label: "Lien de calendrier",
        type: "select",
        options: ["Démo produit — 30min", "Onboarding — 45min"],
        defaultValue: "Démo produit — 30min",
      },
      { key: "slotsCount", label: "Nombre de créneaux proposés", type: "number", defaultValue: 3 },
    ],
  },
  {
    id: "meeting-remind",
    category: "meeting",
    title: "Rappel de rendez-vous",
    subtitle: "Email ou SMS avant le call",
    icon: Bell,
    configFields: [
      { key: "hoursBefore", label: "Heures avant le RDV", type: "number", defaultValue: 24 },
    ],
  },
  {
    id: "meeting-noshow",
    category: "meeting",
    title: "Détecter une absence",
    subtitle: "Le prospect ne s'est pas présenté",
    icon: CalendarX,
    branches: [
      { id: "attended", label: "Présent" },
      { id: "noshow", label: "Absent" },
    ],
    configFields: [
      {
        key: "autoReschedule",
        label: "Reproposer automatiquement",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "meeting-video-create",
    category: "meeting",
    title: "Créer un lien de visio",
    subtitle: "Génère une salle de réunion",
    icon: Video,
    configFields: [
      {
        key: "provider",
        label: "Outil de visio",
        type: "select",
        options: ["Google Meet", "Zoom", "Microsoft Teams"],
        defaultValue: "Google Meet",
      },
    ],
  },
  {
    id: "meeting-followup",
    category: "meeting",
    title: "Relance post-réunion",
    subtitle: "Message automatique après le call",
    icon: PhoneOutgoing,
    configFields: [
      { key: "delayHours", label: "Délai après réunion (h)", type: "number", defaultValue: 2 },
    ],
  },

  {
    id: "crm-create-contact",
    category: "crm",
    title: "Créer un contact",
    subtitle: "Ajouter une fiche dans le CRM",
    icon: Contact,
    tags: ["Populaire"],
    configFields: [
      {
        key: "owner",
        label: "Assigner à",
        type: "select",
        options: ["Commercial responsable du secteur", "Round-robin équipe", "Manager"],
        defaultValue: "Round-robin équipe",
      },
    ],
  },
  {
    id: "crm-update-stage",
    category: "crm",
    title: "Mettre à jour l'étape pipeline",
    subtitle: "Faire progresser l'opportunité",
    icon: Handshake,
    configFields: [
      {
        key: "stage",
        label: "Nouvelle étape",
        type: "select",
        options: ["Qualifié", "Proposition", "Négociation", "Gagné"],
        defaultValue: "Qualifié",
      },
    ],
  },
  {
    id: "crm-create-deal",
    category: "crm",
    title: "Créer une opportunité",
    subtitle: "Nouveau deal dans le pipeline",
    icon: Briefcase,
    configFields: [
      {
        key: "pipeline",
        label: "Pipeline",
        type: "select",
        options: ["Nouvelle affaire", "Expansion compte", "Renouvellement"],
        defaultValue: "Nouvelle affaire",
      },
      { key: "estimatedValue", label: "Valeur estimée (€)", type: "number", defaultValue: 10000 },
    ],
  },
  {
    id: "crm-assign-owner",
    category: "crm",
    title: "Assigner un propriétaire",
    subtitle: "Répartir entre commerciaux",
    icon: UserCog,
    configFields: [
      {
        key: "strategy",
        label: "Stratégie d'assignation",
        type: "select",
        options: ["Round-robin", "Par territoire", "Par charge de travail"],
        defaultValue: "Round-robin",
      },
    ],
  },
  {
    id: "crm-log-activity",
    category: "crm",
    title: "Journaliser une activité",
    subtitle: "Historiser une interaction",
    icon: Building,
    configFields: [
      {
        key: "activityType",
        label: "Type d'activité",
        type: "select",
        options: ["Appel", "Email", "Réunion", "Note"],
        defaultValue: "Note",
      },
    ],
  },

  {
    id: "email-send",
    category: "email",
    title: "Envoyer un email",
    subtitle: "Message unique personnalisé",
    icon: Send,
    tags: ["Populaire"],
    configFields: [
      {
        key: "template",
        label: "Modèle d'email",
        type: "select",
        options: ["Prise de contact", "Relance douce", "Étude de cas", "Dernière chance"],
        defaultValue: "Prise de contact",
      },
      {
        key: "fromAlias",
        label: "Expéditeur",
        type: "select",
        options: ["Compte principal", "Alias commercial", "Fondateur"],
        defaultValue: "Compte principal",
      },
    ],
  },
  {
    id: "email-sequence",
    category: "email",
    title: "Ajouter à une séquence",
    subtitle: "Enchaînement multi-emails",
    icon: MailOpen,
    configFields: [
      {
        key: "sequence",
        label: "Séquence",
        type: "select",
        options: ["Onboarding prospect", "Nurturing 5 étapes", "Réactivation"],
        defaultValue: "Nurturing 5 étapes",
      },
    ],
  },
  {
    id: "email-check-reply",
    category: "email",
    title: "Vérifier la réponse",
    subtitle: "A-t-il répondu à l'email ?",
    icon: Reply,
    branches: [
      { id: "replied", label: "A répondu" },
      { id: "no-reply", label: "Pas de réponse" },
    ],
    configFields: [
      { key: "waitDays", label: "Délai d'attente (jours)", type: "number", defaultValue: 3 },
    ],
  },
  {
    id: "email-track-open",
    category: "email",
    title: "Détecter l'ouverture",
    subtitle: "Suivi de l'engagement email",
    icon: MailCheck,
    configFields: [
      {
        key: "trackClicks",
        label: "Suivre aussi les clics",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "email-unsubscribe",
    category: "email",
    title: "Gérer le désabonnement",
    subtitle: "Retirer des séquences actives",
    icon: Reply,
    configFields: [
      {
        key: "suppressDays",
        label: "Durée de suppression (jours)",
        type: "number",
        defaultValue: 365,
      },
    ],
  },
  {
    id: "email-bounce",
    category: "email",
    title: "Détecter un rejet (Bounce)",
    subtitle: "Agir si l'email n'est pas délivré",
    icon: MailX,
    tags: ["Critique"],
    branches: [
      { id: "delivered", label: "Délivré" },
      { id: "bounced", label: "Rejeté" },
    ],
    configFields: [
      {
        key: "actionOnBounce",
        label: "Action en cas de rejet",
        type: "select",
        options: ["Marquer le lead comme invalide", "Réessayer plus tard", "Notifier l'équipe"],
        defaultValue: "Marquer le lead comme invalide",
      },
    ],
  },

  {
    id: "li-connect",
    category: "linkedin",
    title: "Envoyer une invitation",
    subtitle: "Demande de connexion personnalisée",
    icon: UserPlus,
    tags: ["Populaire"],
    configFields: [
      {
        key: "note",
        label: "Note d'invitation",
        type: "textarea",
        placeholder: "Bonjour {{prenom}}, ravi de...",
      },
    ],
  },
  {
    id: "li-message",
    category: "linkedin",
    title: "Envoyer un message",
    subtitle: "Message direct à une relation",
    icon: MessageCircle,
    configFields: [
      {
        key: "template",
        label: "Modèle de message",
        type: "select",
        options: ["Introduction", "Suivi de contenu", "Invitation démo"],
        defaultValue: "Introduction",
      },
    ],
  },
  {
    id: "li-view-profile",
    category: "linkedin",
    title: "Visiter le profil",
    subtitle: "Générer une notification de vue",
    icon: Linkedin,
    configFields: [
      { key: "silentMode", label: "Mode discret", type: "toggle", defaultValue: bool(false) },
    ],
  },
  {
    id: "li-engage-post",
    category: "linkedin",
    title: "Interagir avec une publication",
    subtitle: "Like ou commentaire automatique",
    icon: ThumbsUp,
    configFields: [
      {
        key: "action",
        label: "Type d'interaction",
        type: "select",
        options: ["Aimer", "Commenter", "Les deux"],
        defaultValue: "Aimer",
      },
    ],
  },
  {
    id: "li-check-accepted",
    category: "linkedin",
    title: "Vérifier l'acceptation",
    subtitle: "L'invitation a-t-elle été acceptée ?",
    icon: UserCheck,
    branches: [
      { id: "accepted", label: "Acceptée" },
      { id: "pending", label: "En attente" },
    ],
    configFields: [
      { key: "maxWaitDays", label: "Délai max (jours)", type: "number", defaultValue: 7 },
    ],
  },

  {
    id: "phone-call-task",
    category: "phone",
    title: "Créer une tâche d'appel",
    subtitle: "Assigner un appel à un commercial",
    icon: PhoneCall,
    tags: ["Populaire"],
    configFields: [
      {
        key: "priority",
        label: "Priorité",
        type: "select",
        options: ["Basse", "Normale", "Haute", "Urgente"],
        defaultValue: "Normale",
      },
    ],
  },
  {
    id: "phone-dial-auto",
    category: "phone",
    title: "Numérotation automatique",
    subtitle: "Lancer un appel via le dialer",
    icon: PhoneOutgoing,
    tags: ["Beta"],
    configFields: [
      {
        key: "callerId",
        label: "Numéro affiché",
        type: "select",
        options: ["Numéro local", "Numéro national", "Numéro masqué"],
        defaultValue: "Numéro local",
      },
    ],
  },
  {
    id: "phone-voicemail",
    category: "phone",
    title: "Laisser un message vocal",
    subtitle: "Message préenregistré si absent",
    icon: Voicemail,
    configFields: [
      {
        key: "script",
        label: "Script vocal",
        type: "select",
        options: ["Standard", "Personnalisé IA"],
        defaultValue: "Standard",
      },
    ],
  },
  {
    id: "phone-sms",
    category: "phone",
    title: "Envoyer un SMS",
    subtitle: "Message texte court",
    icon: PhoneIncoming,
    configFields: [
      {
        key: "message",
        label: "Contenu du SMS",
        type: "textarea",
        placeholder: "Bonjour {{prenom}}, ...",
      },
    ],
  },
  {
    id: "phone-transfer",
    category: "phone",
    title: "Transférer l'appel",
    subtitle: "Router vers le bon commercial",
    icon: PhoneForwarded,
    configFields: [
      {
        key: "target",
        label: "Destinataire",
        type: "select",
        options: ["Account Executive", "SDR de secteur", "Manager"],
        defaultValue: "Account Executive",
      },
    ],
  },
  {
    id: "phone-whatsapp",
    category: "phone",
    title: "Envoyer un WhatsApp",
    subtitle: "Message texte, image ou template certifié",
    icon: MessageCircle,
    tags: ["Populaire"],
    configFields: [
      {
        key: "template",
        label: "Modèle WhatsApp (certifié)",
        type: "select",
        options: ["Relance douce", "Confirmation RDV", "Envoi de devis"],
        defaultValue: "Relance douce",
      },
      {
        key: "mediaType",
        label: "Type de contenu",
        type: "select",
        options: ["Texte seul", "Image", "Document PDF"],
        defaultValue: "Texte seul",
      },
      {
        key: "allowReply",
        label: "Activer le suivi des réponses",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },

  {
    id: "export-csv",
    category: "export",
    title: "Exporter en CSV",
    subtitle: "Télécharger la liste des leads",
    icon: FileSpreadsheet,
    tags: ["Populaire"],
    configFields: [
      {
        key: "columns",
        label: "Colonnes incluses",
        type: "tags",
        placeholder: "nom, email, score",
        defaultValue: "nom, email, score",
      },
    ],
  },
  {
    id: "export-json",
    category: "export",
    title: "Exporter en JSON",
    subtitle: "Format structuré pour intégration",
    icon: FileJson,
    configFields: [
      { key: "pretty", label: "Formatage lisible", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "export-pdf-report",
    category: "export",
    title: "Exporter en rapport PDF",
    subtitle: "Synthèse imprimable",
    icon: FileText,
    configFields: [
      {
        key: "includeCharts",
        label: "Inclure les graphiques",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "export-google-sheets",
    category: "export",
    title: "Envoyer vers Google Sheets",
    subtitle: "Synchronisation en temps réel",
    icon: Table2,
    configFields: [
      {
        key: "sheetUrl",
        label: "URL de la feuille",
        type: "text",
        placeholder: "https://docs.google.com/...",
      },
    ],
  },
  {
    id: "export-warehouse",
    category: "export",
    title: "Envoyer vers un data warehouse",
    subtitle: "BigQuery, Snowflake, etc.",
    icon: FileOutput,
    tags: ["Pro"],
    configFields: [
      {
        key: "destination",
        label: "Destination",
        type: "select",
        options: ["BigQuery", "Snowflake", "Redshift"],
        defaultValue: "BigQuery",
      },
    ],
  },

  {
    id: "notif-slack",
    category: "notification",
    title: "Alerte Slack",
    subtitle: "Notifier un canal de l'équipe",
    icon: Bell,
    tags: ["Populaire"],
    configFields: [
      {
        key: "channel",
        label: "Canal Slack",
        type: "select",
        options: ["ventes", "leads-chauds", "alertes-ia"],
        defaultValue: "leads-chauds",
      },
    ],
  },
  {
    id: "notif-inapp",
    category: "notification",
    title: "Notification dans l'app",
    subtitle: "Cloche de notification LeadCortex",
    icon: BellRing,
    configFields: [
      {
        key: "priority",
        label: "Priorité",
        type: "select",
        options: ["Info", "Importante", "Critique"],
        defaultValue: "Info",
      },
    ],
  },
  {
    id: "notif-email-internal",
    category: "notification",
    title: "Email interne d'alerte",
    subtitle: "Prévenir un membre de l'équipe",
    icon: BellPlus,
    configFields: [
      {
        key: "recipient",
        label: "Destinataire",
        type: "text",
        placeholder: "manager@entreprise.com",
      },
    ],
  },
  {
    id: "notif-hot-lead",
    category: "notification",
    title: "Alerte lead brûlant",
    subtitle: "Signal fort à traiter immédiatement",
    icon: Flame,
    tags: ["IA"],
    configFields: [
      { key: "urgencyThreshold", label: "Seuil d'urgence", type: "number", defaultValue: 90 },
    ],
  },
  {
    id: "notif-digest",
    category: "notification",
    title: "Résumé périodique",
    subtitle: "Digest quotidien ou hebdomadaire",
    icon: Star,
    inputs: [
      { id: "in", label: "Source 1" },
      { id: "in2", label: "Source 2" },
    ],
    dynamicInputs: true,
    inlineLimit: 4,
    configFields: [
      {
        key: "frequency",
        label: "Fréquence",
        type: "select",
        options: ["Quotidien", "Hebdomadaire"],
        defaultValue: "Quotidien",
      },
      { key: "sendAt", label: "Heure d'envoi", type: "text", placeholder: "09:00" },
      {
        key: "channel",
        label: "Canal",
        type: "select",
        options: ["Email", "Slack", "In-app"],
        defaultValue: "Email",
      },
      { key: "onlyIfData", label: "Ignorer si vide", type: "toggle", defaultValue: bool(true) },
    ],
  },

  {
    id: "webhook-send",
    category: "webhook",
    title: "Envoyer un webhook sortant",
    subtitle: "POST vers une URL externe",
    icon: Webhook,
    tags: ["Populaire"],
    configFields: [
      {
        key: "url",
        label: "URL cible",
        type: "text",
        placeholder: "https://api.exemple.com/leads",
      },
      {
        key: "method",
        label: "Méthode",
        type: "select",
        options: ["POST", "PUT", "PATCH"],
        defaultValue: "POST",
      },
    ],
  },
  {
    id: "webhook-listen",
    category: "webhook",
    title: "Écouter un webhook",
    subtitle: "Attend une réponse asynchrone",
    icon: PlugZap,
    configFields: [
      { key: "timeoutSeconds", label: "Délai d'expiration (s)", type: "number", defaultValue: 60 },
    ],
  },
  {
    id: "webhook-transform-payload",
    category: "webhook",
    title: "Transformer le payload",
    subtitle: "Reformater avant envoi",
    icon: Braces,
    configFields: [
      {
        key: "mapping",
        label: "Mapping des champs",
        type: "code",
        placeholder: '{ "email": "lead.email" }',
      },
    ],
  },
  {
    id: "webhook-signature",
    category: "webhook",
    title: "Vérifier la signature",
    subtitle: "Valider l'authenticité d'un appel entrant",
    icon: Key,
    configFields: [
      {
        key: "secretRef",
        label: "Référence du secret",
        type: "text",
        placeholder: "WEBHOOK_SECRET",
      },
    ],
  },
  {
    id: "webhook-relay",
    category: "webhook",
    title: "Relayer vers plusieurs URLs",
    subtitle: "Diffusion multi-destinations",
    icon: Link2,
    configFields: [
      { key: "urls", label: "URLs de destination", type: "tags", placeholder: "url1, url2" },
    ],
  },

  {
    id: "api-call",
    category: "api",
    title: "Appel API générique",
    subtitle: "Requête HTTP configurable",
    icon: Code2,
    tags: ["Populaire"],
    configFields: [
      {
        key: "endpoint",
        label: "Endpoint",
        type: "text",
        placeholder: "https://api.service.com/v1/...",
      },
      {
        key: "method",
        label: "Méthode HTTP",
        type: "select",
        options: ["GET", "POST", "PUT", "DELETE"],
        defaultValue: "GET",
      },
      {
        key: "authType",
        label: "Type d'authentification",
        type: "select",
        options: ["Aucune", "Bearer token", "API Key", "OAuth2"],
        defaultValue: "Bearer token",
      },
    ],
  },
  {
    id: "api-graphql",
    category: "api",
    title: "Requête GraphQL",
    subtitle: "Interroger une API GraphQL",
    icon: Terminal,
    configFields: [
      {
        key: "query",
        label: "Requête GraphQL",
        type: "code",
        placeholder: "query { leads { id email } }",
      },
    ],
  },
  {
    id: "api-oauth-refresh",
    category: "api",
    title: "Rafraîchir un jeton OAuth",
    subtitle: "Renouvellement automatique",
    icon: Lock,
    configFields: [
      {
        key: "provider",
        label: "Fournisseur OAuth",
        type: "text",
        placeholder: "Google, HubSpot...",
      },
    ],
  },
  {
    id: "api-rate-limit",
    category: "api",
    title: "Gérer la limite de débit",
    subtitle: "Ralentir pour respecter le quota",
    icon: SlidersHorizontal,
    configFields: [
      { key: "requestsPerMinute", label: "Requêtes / minute", type: "number", defaultValue: 60 },
    ],
  },
  {
    id: "api-parse-response",
    category: "api",
    title: "Parser la réponse",
    subtitle: "Extraire des champs spécifiques",
    icon: BracesIcon,
    configFields: [
      { key: "jsonPath", label: "Chemin JSON", type: "text", placeholder: "$.data.leads[*].email" },
    ],
  },

  {
    id: "int-salesforce",
    category: "integration",
    title: "Synchroniser avec Salesforce",
    subtitle: "Push/pull d'objets CRM",
    icon: Puzzle,
    tags: ["Populaire"],
    configFields: [
      {
        key: "object",
        label: "Objet Salesforce",
        type: "select",
        options: ["Lead", "Contact", "Opportunity", "Account"],
        defaultValue: "Lead",
      },
    ],
  },
  {
    id: "int-hubspot",
    category: "integration",
    title: "Synchroniser avec HubSpot",
    subtitle: "Contacts et deals HubSpot",
    icon: Plug,
    configFields: [
      { key: "pipeline", label: "Pipeline HubSpot", type: "text", placeholder: "Sales Pipeline" },
    ],
  },
  {
    id: "int-slack-workflow",
    category: "integration",
    title: "Déclencher un workflow Slack",
    subtitle: "Automatisation Slack native",
    icon: Component,
    configFields: [
      {
        key: "workflowName",
        label: "Nom du workflow Slack",
        type: "text",
        placeholder: "Alerte deal signé",
      },
    ],
  },
  {
    id: "int-zapier",
    category: "integration",
    title: "Envoyer vers Zapier",
    subtitle: "Déclencher un Zap externe",
    icon: ExternalLink,
    configFields: [
      { key: "zapId", label: "Identifiant du Zap", type: "text", placeholder: "zap_84213" },
    ],
  },
  {
    id: "int-chrome-extension",
    category: "integration",
    title: "Synchroniser l'extension Chrome",
    subtitle: "Données capturées en navigation",
    icon: Chrome,
    tags: ["Beta"],
    configFields: [
      { key: "autoImport", label: "Import automatique", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "int-intercom",
    category: "integration",
    title: "Créer un lead dans Intercom",
    subtitle: "Push vers l'outil de conversation client",
    icon: MessagesSquare,
    configFields: [
      {
        key: "intercomAction",
        label: "Action",
        type: "select",
        options: ["Créer un contact", "Attribuer à un commercial", "Envoyer un message automatisé"],
        defaultValue: "Créer un contact",
      },
      {
        key: "assignee",
        label: "Assigner à",
        type: "text",
        placeholder: "ID de l'équipe ou de l'agent",
      },
    ],
  },

  {
    id: "util-comment",
    category: "utility",
    title: "Ajouter une note interne",
    subtitle: "Commentaire visible en édition",
    icon: Edit3,
    noteField: "text",
    configFields: [
      {
        key: "text",
        label: "Texte de la note",
        type: "textarea",
        placeholder: "Étape à valider avec l'équipe RevOps",
      },
    ],
  },
  {
    id: "util-sub-workflow",
    category: "utility",
    title: "Appeler un sous-workflow",
    subtitle: "Réutiliser un flux existant",
    icon: Workflow,
    configFields: [
      {
        key: "workflowRef",
        label: "Workflow à appeler",
        type: "select",
        options: ["Nettoyage de données", "Enrichissement standard", "Séquence de relance"],
        defaultValue: "Enrichissement standard",
      },
    ],
  },
  {
    id: "util-merge",
    category: "utility",
    title: "Fusionner des branches",
    subtitle: "Recombiner plusieurs chemins",
    icon: GitFork,
    inputs: [
      { id: "in", label: "Branche A" },
      { id: "in2", label: "Branche B" },
      { id: "in3", label: "Branche C" },
    ],
    dynamicInputs: true,
    inlineLimit: 4,
    configFields: [
      {
        key: "strategy",
        label: "Stratégie de fusion",
        type: "select",
        options: ["Attendre toutes les branches", "Première branche terminée"],
        defaultValue: "Attendre toutes les branches",
      },
      {
        key: "conflict",
        label: "Conflits",
        type: "select",
        options: ["Garder la 1re valeur", "Garder la dernière", "Concaténer"],
        defaultValue: "Garder la 1re valeur",
      },
      { key: "timeout", label: "Timeout (min)", type: "number", defaultValue: 30 },
      { key: "dedupe", label: "Dédupliquer", type: "toggle", defaultValue: bool(true) },
    ],
  },
  {
    id: "util-dedup-clean",
    category: "utility",
    title: "Nettoyer les données",
    subtitle: "Normaliser noms, emails, téléphones",
    icon: RefreshCw,
    configFields: [
      {
        key: "normalizeCase",
        label: "Normaliser la casse",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "util-approval",
    category: "utility",
    title: "Demander une validation humaine",
    subtitle: "Pause jusqu'à approbation manuelle",
    icon: ShieldCheck,
    tags: ["Populaire"],
    branches: [
      { id: "approved", label: "Approuvé" },
      { id: "rejected", label: "Rejeté" },
    ],
    configFields: [
      {
        key: "approver",
        label: "Validateur",
        type: "select",
        options: ["Manager commercial", "Responsable RevOps", "Fondateur"],
        defaultValue: "Manager commercial",
      },
    ],
  },
  {
    id: "util-throttle",
    category: "utility",
    title: "Limiteur de débit (Throttle)",
    subtitle: "Ralentir le flux pour respecter les quotas",
    icon: Timer,
    tags: ["Anti-spam", "Critique"],
    configFields: [
      { key: "maxActions", label: "Actions max", type: "number", defaultValue: 20 },
      {
        key: "timeWindow",
        label: "Fenêtre de temps",
        type: "select",
        options: ["Par heure", "Par jour"],
        defaultValue: "Par heure",
      },
      {
        key: "actionType",
        label: "Action concernée",
        type: "select",
        options: ["Emails", "LinkedIn Invites", "Tous"],
        defaultValue: "Emails",
      },
    ],
  },

  {
    id: "report-generate",
    category: "report",
    title: "Générer un rapport",
    subtitle: "Synthèse de performance du workflow",
    icon: BarChart3,
    tags: ["Populaire"],
    inputs: [
      { id: "in", label: "Données 1" },
      { id: "in2", label: "Données 2" },
    ],
    dynamicInputs: true,
    inlineLimit: 4,
    configFields: [
      {
        key: "period",
        label: "Période couverte",
        type: "select",
        options: ["7 derniers jours", "30 derniers jours", "Trimestre"],
        defaultValue: "30 derniers jours",
      },
      {
        key: "format",
        label: "Format",
        type: "select",
        options: ["PDF", "Tableau", "Dashboard"],
        defaultValue: "PDF",
      },
      { key: "recipients", label: "Destinataires", type: "text", placeholder: "team@acme.com" },
      { key: "compare", label: "Comparer N-1", type: "toggle", defaultValue: bool(false) },
    ],
  },
  {
    id: "report-funnel",
    category: "report",
    title: "Analyser l'entonnoir",
    subtitle: "Taux de conversion par étape",
    icon: PieChart,
    configFields: [
      {
        key: "groupBy",
        label: "Regrouper par",
        type: "select",
        options: ["Étape du workflow", "Source du lead", "Commercial"],
        defaultValue: "Étape du workflow",
      },
    ],
  },
  {
    id: "report-trend",
    category: "report",
    title: "Suivre une tendance",
    subtitle: "Évolution d'une métrique dans le temps",
    icon: LineChart,
    configFields: [
      {
        key: "metric",
        label: "Métrique suivie",
        type: "select",
        options: ["Taux de réponse", "Taux de conversion", "Score moyen"],
        defaultValue: "Taux de réponse",
      },
    ],
  },
  {
    id: "report-benchmark",
    category: "report",
    title: "Comparer à un objectif",
    subtitle: "Écart par rapport à la cible",
    icon: Target,
    configFields: [{ key: "target", label: "Objectif cible", type: "number", defaultValue: 100 }],
  },
  {
    id: "report-export-dashboard",
    category: "report",
    title: "Publier sur un tableau de bord",
    subtitle: "Mise à jour d'un dashboard partagé",
    icon: Table2,
    configFields: [
      {
        key: "dashboard",
        label: "Tableau de bord",
        type: "select",
        options: ["Vue direction", "Vue équipe SDR", "Vue RevOps"],
        defaultValue: "Vue équipe SDR",
      },
    ],
  },

  // ───────────────────────── GESTION DES ERREURS ─────────────────────────
  {
    id: "error-try-catch",
    category: "error",
    title: "Essayer / Capturer",
    subtitle: "Isoler les étapes risquées",
    icon: ShieldAlert,
    tags: ["Populaire"],
    branches: [
      { id: "success", label: "Succès" },
      { id: "error", label: "Erreur" },
    ],
    configFields: [
      {
        key: "logErrors",
        label: "Journaliser les erreurs",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },
  {
    id: "error-retry-policy",
    category: "error",
    title: "Politique de nouvelle tentative",
    subtitle: "Réessayer selon un intervalle croissant",
    icon: RotateCcw,
    configFields: [
      { key: "maxAttempts", label: "Tentatives max", type: "number", defaultValue: 5 },
      {
        key: "strategy",
        label: "Stratégie",
        type: "select",
        options: ["Intervalle fixe", "Exponentiel"],
        defaultValue: "Exponentiel",
      },
    ],
  },
  {
    id: "error-fallback",
    category: "error",
    title: "Chemin de repli",
    subtitle: "Action alternative en cas d'échec",
    icon: AlertCircle,
    inputs: [
      { id: "in", label: "Flux principal" },
      { id: "error", label: "Erreur" },
    ],
    configFields: [
      {
        key: "fallbackAction",
        label: "Action de repli",
        type: "select",
        options: ["Notifier l'équipe", "Ignorer et continuer", "Arrêter le workflow"],
        defaultValue: "Notifier l'équipe",
      },
    ],
  },
  {
    id: "error-stop-workflow",
    category: "error",
    title: "Arrêter le workflow",
    subtitle: "Interruption immédiate et contrôlée",
    icon: AlertTriangle,
    terminal: true,
    configFields: [
      {
        key: "reason",
        label: "Motif d'arrêt",
        type: "text",
        placeholder: "Donnée invalide détectée",
      },
    ],
  },
  {
    id: "error-alert-oncall",
    category: "error",
    title: "Alerter l'équipe technique",
    subtitle: "Escalade en cas d'erreur critique",
    icon: Bell,
    configFields: [
      {
        key: "severity",
        label: "Sévérité",
        type: "select",
        options: ["Mineure", "Majeure", "Critique"],
        defaultValue: "Majeure",
      },
    ],
  },

  // entrée mais n'ont jamais de sortie (`terminal: true`) puisqu'ils
  {
    id: "end-workflow",
    category: "end",
    title: "Fin d'automatisation",
    subtitle: "Arrête tout le workflow ici",
    icon: CircleStop,
    tags: ["Populaire"],
    terminal: true,
    configFields: [
      {
        key: "outcome",
        label: "Résultat",
        type: "select",
        options: ["Succès", "Neutre", "Échec"],
        defaultValue: "Succès",
      },
      {
        key: "note",
        label: "Note de fin",
        type: "text",
        placeholder: "Ex : lead qualifié transmis au CRM",
      },
    ],
  },
  {
    id: "end-branch",
    category: "end",
    title: "Fin de branche",
    subtitle: "Termine cette branche sans arrêter les autres",
    icon: Flag,
    terminal: true,
    configFields: [
      {
        key: "note",
        label: "Note",
        type: "text",
        placeholder: "Ex : hors cible, on n'entame pas la suite",
      },
    ],
  },
  {
    id: "end-error",
    category: "end",
    title: "Arrêt avec erreur",
    subtitle: "Stoppe le workflow et le marque en échec",
    icon: OctagonX,
    terminal: true,
    configFields: [
      {
        key: "errorMessage",
        label: "Message d'erreur",
        type: "text",
        placeholder: "Raison de l'échec",
      },
      {
        key: "notifyTeam",
        label: "Notifier l'équipe",
        type: "toggle",
        defaultValue: bool(true),
      },
    ],
  },

  {
    id: "custom-script",
    category: "custom",
    title: "Script personnalisé",
    subtitle: "Logique sur mesure en code",
    icon: Terminal,
    tags: ["Pro", "Code"],
    configFields: [
      {
        key: "language",
        label: "Langage",
        type: "select",
        options: CODE_LANGUAGE_LABELS,
        defaultValue: "JavaScript",
      },
      {
        key: "code",
        label: "Code",
        type: "code",
        placeholder: "return lead.score > 50;",
        defaultValue: "// Reçoit `lead`, `company`, `context`\nreturn lead.score > 50;",
      },
    ],
  },
  {
    id: "custom-template",
    category: "custom",
    title: "Modèle réutilisable",
    subtitle: "Bloc composite sauvegardé",
    icon: Component,
    configFields: [
      {
        key: "templateName",
        label: "Nom du modèle",
        type: "text",
        placeholder: "Qualification standard",
      },
    ],
  },
  {
    id: "custom-note",
    category: "custom",
    title: "Bloc annotation",
    subtitle: "Marqueur visuel sans effet",
    icon: CircleDot,
    configFields: [
      { key: "label", label: "Libellé affiché", type: "text", placeholder: "⚠️ Zone en test" },
    ],
  },
  {
    id: "custom-experiment",
    category: "custom",
    title: "Bloc expérimental",
    subtitle: "Fonctionnalité en cours de test",
    icon: Beaker,
    tags: ["Beta"],
    configFields: [
      {
        key: "experimentName",
        label: "Nom de l'expérimentation",
        type: "text",
        placeholder: "Scoring v2",
      },
    ],
  },
  {
    id: "custom-placeholder",
    category: "custom",
    title: "Bloc à définir",
    subtitle: "Emplacement réservé pour plus tard",
    icon: Blocks,
    configFields: [
      {
        key: "todo",
        label: "À faire",
        type: "textarea",
        placeholder: "Définir la logique métier ici",
      },
    ],
  },

  {
    id: "org-note",
    category: "organisation",
    title: "Note / Pense-bête",
    subtitle: "Texte libre pour documenter le workflow",
    icon: StickyNote,
    tags: ["Organisation", "Note", "Commentaire"],
    noteField: "body",
    configFields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Contexte de cette branche" },
      {
        key: "body",
        label: "Contenu",
        type: "textarea",
        placeholder: "Écris ici ta note, ton rappel ou ta consigne…",
      },
    ],
  },
  {
    id: "org-section",
    category: "organisation",
    title: "Groupement / Section",
    subtitle: "Regrouper visuellement une partie du canevas",
    icon: FolderKanban,
    tags: ["Organisation", "Groupe", "Section"],
    configFields: [
      { key: "name", label: "Nom de la section", type: "text", placeholder: "Phase 1 — Sourcing" },
      {
        key: "color",
        label: "Couleur",
        type: "select",
        options: ["Sable", "Terracotta", "Vert", "Bleu", "Violet", "Gris"],
        defaultValue: "Sable",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Ce que fait cette phase du workflow…",
      },
      { key: "owner", label: "Responsable", type: "text", placeholder: "@marie" },
    ],
    noteField: "description",
    inlineLimit: 3,
  },
  {
    id: "org-checklist",
    category: "organisation",
    title: "Check-list / Tâches",
    subtitle: "Suivre les étapes à faire sur ce workflow",
    icon: ListChecks,
    tags: ["Organisation", "Tâches", "Todo"],
    noteField: "items",
    inlineLimit: 2,
    configFields: [
      { key: "title", label: "Titre", type: "text", placeholder: "À finaliser avant activation" },
      {
        key: "items",
        label: "Éléments (un par ligne)",
        type: "textarea",
        placeholder: "Valider l'ICP\nBrancher le CRM\nTester la séquence",
      },
      { key: "done", label: "Terminée", type: "toggle", defaultValue: bool(false) },
    ],
  },
  {
    id: "org-tag",
    category: "organisation",
    title: "Étiquette / Tag",
    subtitle: "Marquer une zone du canevas",
    icon: Tag,
    tags: ["Organisation", "Label", "Tag"],
    configFields: [
      { key: "label", label: "Étiquette", type: "text", placeholder: "Prioritaire" },
      {
        key: "tone",
        label: "Ton",
        type: "select",
        options: ["Neutre", "Info", "Succès", "Attention", "Critique"],
        defaultValue: "Neutre",
      },
    ],
  },
  {
    id: "org-team-message",
    category: "organisation",
    title: "Message pour l'équipe",
    subtitle: "Consigne adressée aux membres du workspace",
    icon: MessagesSquare,
    tags: ["Organisation", "Équipe", "Collaboration"],
    noteField: "message",
    inlineLimit: 2,
    configFields: [
      {
        key: "audience",
        label: "Destinataires",
        type: "text",
        placeholder: "@sales, @growth ou toute l'équipe",
      },
      {
        key: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Ne pas activer avant validation juridique.",
      },
      {
        key: "priority",
        label: "Priorité",
        type: "select",
        options: ["Basse", "Normale", "Haute"],
        defaultValue: "Normale",
      },
    ],
  },
  {
    id: "org-highlight",
    category: "organisation",
    title: "Surlignage / Repère",
    subtitle: "Attirer l'attention sur une zone",
    icon: Highlighter,
    tags: ["Organisation", "Repère"],
    configFields: [{ key: "label", label: "Libellé", type: "text", placeholder: "À revoir" }],
  },
];

export const totalBlocksCount = BLOCKS.length;
