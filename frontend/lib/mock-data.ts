//frontend\lib\mock-data.ts
export type LeadStatus = "enriched" | "enriching" | "scored" | "queued";

export type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  status: LeadStatus;
  score: number | null;
  email?: string;
  phone?: string;
  signal?: string;
  stage?: "new" | "contacted" | "replied" | "meeting" | "won" | "lost";
  saved?: boolean;
};

export const leads: Lead[] = [
  {
    id: "l1",
    name: "Jean-Luc Morel",
    title: "CTO",
    company: "Aéronautique Lyon",
    industry: "Aerospace",
    location: "Lyon, FR",
    status: "enriched",
    score: 9.4,
    email: "jl.morel@aero-lyon.fr",
    phone: "+33 4 72 00 00 00",
    signal: "Levée de fonds",
    stage: "meeting",
    saved: true,
  },
  {
    id: "l2",
    name: "Clara Dubois",
    title: "Head of Ops",
    company: "Fabriq Auto",
    industry: "Automotive",
    location: "Paris, FR",
    status: "enriching",
    score: null,
    signal: "Recrute 12 ingénieurs",
    stage: "new",
  },
  {
    id: "l3",
    name: "Pierre Vasseur",
    title: "Founder",
    company: "SteelPoint FR",
    industry: "Metallurgy",
    location: "Lille, FR",
    status: "scored",
    score: 8.1,
    email: "pierre@steelpoint.fr",
    signal: "Nouveau site production",
    stage: "contacted",
    saved: true,
  },
  {
    id: "l4",
    name: "Sophie Laurent",
    title: "Engineering Director",
    company: "Naval Systems",
    industry: "Defense",
    location: "Toulon, FR",
    status: "enriched",
    score: 9.8,
    email: "s.laurent@navalsys.com",
    phone: "+33 4 94 00 00 00",
    signal: "Contrat OTAN",
    stage: "replied",
  },
  {
    id: "l5",
    name: "Marc Évrard",
    title: "CTO",
    company: "Mecalux Group",
    industry: "Logistics",
    location: "Barcelona, ES",
    status: "enriched",
    score: 7.2,
    email: "m.evrard@mecalux.com",
    stage: "contacted",
  },
  {
    id: "l6",
    name: "Thomas Berger",
    title: "VP Logistics",
    company: "AirFrance Industries",
    industry: "Aerospace",
    location: "Paris, FR",
    status: "enriched",
    score: 8.5,
    email: "t.berger@af-ind.fr",
    signal: "Digitalisation SI",
    stage: "won",
  },
  {
    id: "l7",
    name: "Elena Rossi",
    title: "CEO",
    company: "Motive France",
    industry: "Manufacturing",
    location: "Lyon, FR",
    status: "enriched",
    score: 9.1,
    email: "e.rossi@motive.fr",
    signal: "Expansion Europe",
    stage: "meeting",
    saved: true,
  },
  {
    id: "l8",
    name: "Lucie Bertrand",
    title: "Technical Lead",
    company: "Schneider Electric",
    industry: "Energy",
    location: "Grenoble, FR",
    status: "enriched",
    score: 6.9,
    email: "l.bertrand@se.com",
    stage: "new",
  },
  {
    id: "l9",
    name: "Antoine Mercier",
    title: "Automation Lead",
    company: "Safran Aerospace",
    industry: "Aerospace",
    location: "Toulouse, FR",
    status: "enriched",
    score: 8.2,
    email: "a.mercier@safran.com",
    signal: "Nouveau CTO",
    stage: "replied",
  },
  {
    id: "l10",
    name: "Mathieu Delcourt",
    title: "Head of Supply Chain",
    company: "Renault Group",
    industry: "Automotive",
    location: "Boulogne, FR",
    status: "queued",
    score: null,
    stage: "new",
  },
  {
    id: "l11",
    name: "Camille Roux",
    title: "Director R&D",
    company: "Michelin",
    industry: "Manufacturing",
    location: "Clermont-Ferrand, FR",
    status: "enriched",
    score: 8.7,
    email: "c.roux@michelin.com",
    signal: "Brevet déposé",
    stage: "contacted",
  },
  {
    id: "l12",
    name: "David Chen",
    title: "COO",
    company: "Legrand Industries",
    industry: "Electrical",
    location: "Limoges, FR",
    status: "scored",
    score: 7.5,
    email: "d.chen@legrand.com",
    stage: "new",
  },
];

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  location: string;
  size: string;
  revenue: string;
  employees: number;
  intent: "hot" | "warm" | "cold";
  saved?: boolean;
};

export const companies: Company[] = [
  {
    id: "c1",
    name: "Aéronautique Lyon",
    domain: "aero-lyon.fr",
    industry: "Aerospace",
    location: "Lyon, FR",
    size: "500-1K",
    revenue: "80M€",
    employees: 640,
    intent: "hot",
    saved: true,
  },
  {
    id: "c2",
    name: "Fabriq Auto",
    domain: "fabriq-auto.fr",
    industry: "Automotive",
    location: "Paris, FR",
    size: "200-500",
    revenue: "42M€",
    employees: 320,
    intent: "hot",
  },
  {
    id: "c3",
    name: "SteelPoint FR",
    domain: "steelpoint.fr",
    industry: "Metallurgy",
    location: "Lille, FR",
    size: "50-200",
    revenue: "18M€",
    employees: 128,
    intent: "warm",
    saved: true,
  },
  {
    id: "c4",
    name: "Naval Systems",
    domain: "navalsys.com",
    industry: "Defense",
    location: "Toulon, FR",
    size: "1K-5K",
    revenue: "220M€",
    employees: 2100,
    intent: "hot",
  },
  {
    id: "c5",
    name: "Mecalux Group",
    domain: "mecalux.com",
    industry: "Logistics",
    location: "Barcelona, ES",
    size: "1K-5K",
    revenue: "310M€",
    employees: 1800,
    intent: "warm",
  },
  {
    id: "c6",
    name: "AirFrance Industries",
    domain: "af-ind.fr",
    industry: "Aerospace",
    location: "Paris, FR",
    size: "5K+",
    revenue: "1.2B€",
    employees: 7200,
    intent: "warm",
  },
  {
    id: "c7",
    name: "Motive France",
    domain: "motive.fr",
    industry: "Manufacturing",
    location: "Lyon, FR",
    size: "50-200",
    revenue: "12M€",
    employees: 84,
    intent: "hot",
    saved: true,
  },
  {
    id: "c8",
    name: "Schneider Electric",
    domain: "se.com",
    industry: "Energy",
    location: "Grenoble, FR",
    size: "5K+",
    revenue: "35B€",
    employees: 135000,
    intent: "cold",
  },
  {
    id: "c9",
    name: "Safran Aerospace",
    domain: "safran.com",
    industry: "Aerospace",
    location: "Toulouse, FR",
    size: "5K+",
    revenue: "23B€",
    employees: 84000,
    intent: "warm",
  },
  {
    id: "c10",
    name: "Renault Group",
    domain: "renault.com",
    industry: "Automotive",
    location: "Boulogne, FR",
    size: "5K+",
    revenue: "46B€",
    employees: 106000,
    intent: "cold",
  },
];

export const activityLog = [
  {
    id: "a1",
    label: "Recherche étendue",
    detail: "Scan de 12 400 profils LinkedIn français.",
    status: "active" as const,
    time: "il y a 2s",
  },
  {
    id: "a2",
    label: "Vérification domaines",
    detail: "24 contacts validés via SMTP handshake.",
    status: "active" as const,
    time: "il y a 8s",
  },
  {
    id: "a3",
    label: "Enrichissement",
    detail: "Signaux d'intention détectés sur 18 comptes.",
    status: "pending" as const,
    time: "en cours",
  },
  {
    id: "a4",
    label: "Génération d'accroches",
    detail: "Rédaction de séquences personnalisées.",
    status: "queued" as const,
    time: "à suivre",
  },
];

export const sequences = [
  {
    id: "s1",
    name: "Industrial CTO — cold outreach",
    leads: 42,
    opens: "68%",
    replies: "14%",
    status: "active",
    steps: 5,
  },
  {
    id: "s2",
    name: "Post-funding congrats",
    leads: 18,
    opens: "72%",
    replies: "22%",
    status: "active",
    steps: 3,
  },
  {
    id: "s3",
    name: "Ops leaders — automation angle",
    leads: 65,
    opens: "51%",
    replies: "9%",
    status: "paused",
    steps: 7,
  },
  {
    id: "s4",
    name: "Founders — peer-to-peer intro",
    leads: 28,
    opens: "81%",
    replies: "31%",
    status: "active",
    steps: 4,
  },
];

export const analyticsSeries = [
  { day: "L", leads: 32, replies: 4 },
  { day: "M", leads: 58, replies: 9 },
  { day: "M", leads: 41, replies: 6 },
  { day: "J", leads: 74, replies: 14 },
  { day: "V", leads: 96, replies: 21 },
  { day: "S", leads: 22, replies: 3 },
  { day: "D", leads: 18, replies: 2 },
];

export type Email = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  status: "replied" | "opened" | "sent" | "bounced";
};

export const emails: Email[] = [
  {
    id: "e1",
    from: "Jean-Luc Morel",
    subject: "Re: Automatisation industrielle",
    preview: "Intéressant, on peut échanger jeudi ?",
    time: "10:24",
    unread: true,
    status: "replied",
  },
  {
    id: "e2",
    from: "Sophie Laurent",
    subject: "Re: Contrat OTAN — synergies",
    preview: "Merci Utilisateur, je transfère à mon équipe.",
    time: "09:12",
    unread: true,
    status: "replied",
  },
  {
    id: "e3",
    from: "Clara Dubois",
    subject: "Prospection industrielle",
    preview: "Ouvert 3 fois — aucun clic pour le moment.",
    time: "hier",
    unread: false,
    status: "opened",
  },
  {
    id: "e4",
    from: "Pierre Vasseur",
    subject: "Nouveau site SteelPoint",
    preview: "Envoyé — délivré à 14:32.",
    time: "hier",
    unread: false,
    status: "sent",
  },
  {
    id: "e5",
    from: "postmaster@renault.com",
    subject: "Undelivered mail",
    preview: "Rebond permanent : boîte inexistante.",
    time: "hier",
    unread: false,
    status: "bounced",
  },
  {
    id: "e6",
    from: "Elena Rossi",
    subject: "Re: Motive France — expansion EU",
    preview: "Rendez-vous confirmé pour mardi 15h.",
    time: "2 jours",
    unread: false,
    status: "replied",
  },
];

export type CallItem = {
  id: string;
  contact: string;
  company: string;
  direction: "outbound" | "inbound";
  duration: string;
  outcome: "connected" | "voicemail" | "no-answer" | "meeting-booked";
  time: string;
};

export const calls: CallItem[] = [
  {
    id: "call1",
    contact: "Jean-Luc Morel",
    company: "Aéronautique Lyon",
    direction: "outbound",
    duration: "8:24",
    outcome: "meeting-booked",
    time: "il y a 1h",
  },
  {
    id: "call2",
    contact: "Clara Dubois",
    company: "Fabriq Auto",
    direction: "outbound",
    duration: "0:00",
    outcome: "voicemail",
    time: "il y a 3h",
  },
  {
    id: "call3",
    contact: "Sophie Laurent",
    company: "Naval Systems",
    direction: "inbound",
    duration: "12:07",
    outcome: "connected",
    time: "hier",
  },
  {
    id: "call4",
    contact: "Marc Évrard",
    company: "Mecalux Group",
    direction: "outbound",
    duration: "0:00",
    outcome: "no-answer",
    time: "hier",
  },
  {
    id: "call5",
    contact: "Elena Rossi",
    company: "Motive France",
    direction: "outbound",
    duration: "22:15",
    outcome: "meeting-booked",
    time: "il y a 2 jours",
  },
];

export type Subtask = { id: string; title: string; done: boolean };

export type TaskRecurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";

export type TaskStatus = "todo" | "in-progress" | "blocked" | "done";

export type TaskReminder = "none" | "5m" | "15m" | "1h" | "1d";

export type Task = {
  id: string;
  title: string;
  type: "call" | "email" | "linkedin" | "follow-up";
  contact: string;
  due: string;
  priority: "high" | "med" | "low";
  done: boolean;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  recurrence?: TaskRecurrence;
  reminder?: TaskReminder;
  category?: string;
  tags?: string[];
  status?: TaskStatus;
  subtasks?: Subtask[];
  estimate?: number;
  createdAt?: string;
  completedAt?: string;
};

export const tasks: Task[] = [
  {
    id: "t1",
    title: "Appeler pour confirmer le RDV",
    type: "call",
    contact: "Jean-Luc Morel",
    due: "Aujourd'hui",
    priority: "high",
    done: false,
  },
  {
    id: "t2",
    title: "Suivi email — proposition",
    type: "email",
    contact: "Clara Dubois",
    due: "Aujourd'hui",
    priority: "high",
    done: false,
  },
  {
    id: "t3",
    title: "Message LinkedIn de connexion",
    type: "linkedin",
    contact: "Elena Rossi",
    due: "Demain",
    priority: "med",
    done: false,
  },
  {
    id: "t4",
    title: "Relance post-démo",
    type: "follow-up",
    contact: "Sophie Laurent",
    due: "Demain",
    priority: "med",
    done: false,
  },
  {
    id: "t5",
    title: "Envoyer le PDF technique",
    type: "email",
    contact: "Pierre Vasseur",
    due: "Jeudi",
    priority: "low",
    done: true,
  },
  {
    id: "t6",
    title: "Programmer une démo",
    type: "call",
    contact: "Antoine Mercier",
    due: "Vendredi",
    priority: "med",
    done: false,
  },
];

export type Meeting = {
  id: string;
  title: string;
  with: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  type: "discovery" | "demo" | "follow-up" | "closing";
};

export const meetings: Meeting[] = [
  {
    id: "m1",
    title: "Discovery call",
    with: "Jean-Luc Morel",
    company: "Aéronautique Lyon",
    date: "Aujourd'hui",
    time: "14:00",
    duration: "30min",
    type: "discovery",
  },
  {
    id: "m2",
    title: "Démo produit",
    with: "Elena Rossi",
    company: "Motive France",
    date: "Demain",
    time: "10:30",
    duration: "45min",
    type: "demo",
  },
  {
    id: "m3",
    title: "Suivi Naval Systems",
    with: "Sophie Laurent",
    company: "Naval Systems",
    date: "Jeudi",
    time: "16:00",
    duration: "30min",
    type: "follow-up",
  },
  {
    id: "m4",
    title: "Closing SteelPoint",
    with: "Pierre Vasseur",
    company: "SteelPoint FR",
    date: "Vendredi",
    time: "11:00",
    duration: "60min",
    type: "closing",
  },
];

export type Deal = {
  id: string;
  name: string;
  company: string;
  contact: string;
  amount: number;
  stage: "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  close: string;
};

export const deals: Deal[] = [
  {
    id: "d1",
    name: "Aéronautique Lyon — Founder",
    company: "Aéronautique Lyon",
    contact: "Jean-Luc Morel",
    amount: 48000,
    stage: "negotiation",
    probability: 75,
    close: "15 fév",
  },
  {
    id: "d2",
    name: "Motive France — Scale",
    company: "Motive France",
    contact: "Elena Rossi",
    amount: 24000,
    stage: "proposal",
    probability: 55,
    close: "28 fév",
  },
  {
    id: "d3",
    name: "Naval Systems — Enterprise",
    company: "Naval Systems",
    contact: "Sophie Laurent",
    amount: 96000,
    stage: "qualified",
    probability: 30,
    close: "31 mars",
  },
  {
    id: "d4",
    name: "SteelPoint — Founder",
    company: "SteelPoint FR",
    contact: "Pierre Vasseur",
    amount: 18000,
    stage: "proposal",
    probability: 60,
    close: "20 fév",
  },
  {
    id: "d5",
    name: "AirFrance Industries",
    company: "AirFrance Industries",
    contact: "Thomas Berger",
    amount: 120000,
    stage: "won",
    probability: 100,
    close: "10 jan",
  },
  {
    id: "d6",
    name: "Legrand — Trial",
    company: "Legrand Industries",
    contact: "David Chen",
    amount: 12000,
    stage: "qualified",
    probability: 25,
    close: "10 avr",
  },
];

export type Conversation = {
  id: string;
  contact: string;
  company: string;
  last: string;
  channel: "email" | "linkedin" | "call";
  unread: number;
  time: string;
};

export const conversations: Conversation[] = [
  {
    id: "cv1",
    contact: "Jean-Luc Morel",
    company: "Aéronautique Lyon",
    last: "OK pour jeudi 14h, je bloque.",
    channel: "email",
    unread: 2,
    time: "10:24",
  },
  {
    id: "cv2",
    contact: "Sophie Laurent",
    company: "Naval Systems",
    last: "Je te partage l'appel d'offres.",
    channel: "email",
    unread: 1,
    time: "09:12",
  },
  {
    id: "cv3",
    contact: "Elena Rossi",
    company: "Motive France",
    last: "Ravie de vous avoir eu au tel.",
    channel: "linkedin",
    unread: 0,
    time: "hier",
  },
  {
    id: "cv4",
    contact: "Pierre Vasseur",
    company: "SteelPoint FR",
    last: "Vu, je regarde et reviens vers vous.",
    channel: "email",
    unread: 0,
    time: "hier",
  },
];

export type Workflow = {
  id: string;
  name: string;
  trigger: string;
  actions: number;
  runs: number;
  status: "active" | "draft" | "paused";
};

export const workflows: Workflow[] = [
  {
    id: "w1",
    name: "Nouveau lead scoré 8+ → séquence CTO",
    trigger: "Score > 8",
    actions: 4,
    runs: 128,
    status: "active",
  },
  {
    id: "w2",
    name: "Réponse positive → créer opportunité",
    trigger: "Reply intent = positive",
    actions: 3,
    runs: 42,
    status: "active",
  },
  {
    id: "w3",
    name: "Levée de fonds détectée → notif Slack",
    trigger: "Signal = funding",
    actions: 2,
    runs: 21,
    status: "active",
  },
  {
    id: "w4",
    name: "Lead froid 30j → réengagement",
    trigger: "No reply 30d",
    actions: 5,
    runs: 0,
    status: "draft",
  },
];

export type Visitor = {
  id: string;
  company: string;
  location: string;
  pages: number;
  duration: string;
  intent: "hot" | "warm" | "cold";
  time: string;
};

export const visitors: Visitor[] = [
  {
    id: "v1",
    company: "Aéronautique Lyon",
    location: "Lyon, FR",
    pages: 8,
    duration: "4m 12s",
    intent: "hot",
    time: "il y a 3 min",
  },
  {
    id: "v2",
    company: "Motive France",
    location: "Lyon, FR",
    pages: 5,
    duration: "2m 48s",
    intent: "hot",
    time: "il y a 12 min",
  },
  {
    id: "v3",
    company: "Renault Group",
    location: "Boulogne, FR",
    pages: 2,
    duration: "0m 42s",
    intent: "cold",
    time: "il y a 1h",
  },
  {
    id: "v4",
    company: "SteelPoint FR",
    location: "Lille, FR",
    pages: 6,
    duration: "3m 01s",
    intent: "warm",
    time: "il y a 2h",
  },
  {
    id: "v5",
    company: "Safran Aerospace",
    location: "Toulouse, FR",
    pages: 3,
    duration: "1m 18s",
    intent: "warm",
    time: "hier",
  },
];

export type FormItem = {
  id: string;
  name: string;
  submissions: number;
  conversion: string;
  status: "live" | "draft";
};

export const forms: FormItem[] = [
  { id: "f1", name: "Demander une démo", submissions: 142, conversion: "8.4%", status: "live" },
  {
    id: "f2",
    name: "Newsletter industrielle",
    submissions: 316,
    conversion: "12.1%",
    status: "live",
  },
  { id: "f3", name: "Contact commercial", submissions: 88, conversion: "4.2%", status: "live" },
  { id: "f4", name: "Waitlist Enterprise", submissions: 0, conversion: "—", status: "draft" },
];

export type ListItem = {
  id: string;
  name: string;
  type: "people" | "company";
  count: number;
  updated: string;
  shared?: boolean;
};

export const savedLists: ListItem[] = [
  {
    id: "list1",
    name: "CTO industrie France",
    type: "people",
    count: 128,
    updated: "il y a 2h",
    shared: true,
  },
  { id: "list2", name: "SaaS EU 10-50 employés", type: "company", count: 84, updated: "hier" },
  {
    id: "list3",
    name: "Post-funding series A",
    type: "company",
    count: 42,
    updated: "il y a 3 jours",
  },
  {
    id: "list4",
    name: "Founders solos B2B",
    type: "people",
    count: 216,
    updated: "la semaine dernière",
  },
  {
    id: "list5",
    name: "Aerospace decision makers",
    type: "people",
    count: 64,
    updated: "la semaine dernière",
    shared: true,
  },
];
