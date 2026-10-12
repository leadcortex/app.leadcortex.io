//frontend\components\ai-assistant\assistant-engine.ts
export type AssistantAttachment = {
  id: string;
  name: string;
  size: number;
  kind: "image" | "document" | "context";
  url?: string;
};

export type AssistantMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  createdAt: number;
  attachments?: AssistantAttachment[];
  pending?: boolean;
  /** Vrai si le prompt a été modifié puis relancé (badge « modifié »). */
  edited?: boolean;
};

export const PAGE_LABELS: Record<string, string> = {
  "/app": "Dashboard",
  "/app/people": "Prospects",
  "/app/companies": "Entreprises",
  "/app/lists": "Listes",
  "/app/enrichment": "Enrichissement",
  "/app/sequences": "Séquences",
  "/app/emails": "Emails",
  "/app/calls": "Appels",
  "/app/tasks": "Tâches",
  "/app/meetings": "Meetings",
  "/app/conversations": "Conversations",
  "/app/deals": "Opportunités",
  "/app/workflows": "Workflows",
  "/app/analytics": "Analyses",
  "/app/visitors": "Visiteurs",
  "/app/forms": "Formulaires",
  "/app/saved": "Sauvegardés",
};

export function pageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname]!;
  const match = Object.keys(PAGE_LABELS)
    .filter((k) => k !== "/app" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_LABELS[match]! : "Espace de travail";
}

export function contextualSuggestions(pathname: string): string[] {
  const label = pageLabel(pathname);
  const base: Record<string, string[]> = {
    Prospects: [
      "Priorise mes 20 meilleurs prospects",
      "Trouve les doublons dans cette liste",
      "Rédige une accroche pour ce segment",
    ],
    Entreprises: [
      "Quelles entreprises ont un signal d'achat ?",
      "Résume ce compte en 5 points",
      "Compare ces comptes par potentiel",
    ],
    Séquences: [
      "Améliore l'objet de mes emails",
      "Propose une séquence en 5 étapes",
      "Où est le point de rupture de la séquence ?",
    ],
    Emails: ["Réponds à ce fil poliment", "Raccourcis ce message de 40 %", "Relance en 2 lignes"],
    Opportunités: [
      "Quelles opportunités risquent de glisser ?",
      "Prépare mon prochain call",
      "Génère un plan de closing",
    ],
    Analyses: [
      "Explique la baisse de taux de réponse",
      "Quels canaux performent le mieux ?",
      "Génère un résumé hebdomadaire",
    ],
  };
  return (
    base[label] ?? [
      "Que dois-je faire en priorité aujourd'hui ?",
      "Résume l'activité de la semaine",
      "Trouve 50 leads correspondant à mon ICP",
    ]
  );
}

export type Greeting = {
  salutation: string;

  pitch: string;

  slot: "morning" | "afternoon" | "evening" | "night";
};

export function getGreeting(name: string = "Utilisateur", date: Date = new Date()): Greeting {
  const h = date.getHours();

  if (h >= 5 && h < 12) {
    return {
      slot: "morning",
      salutation: `Salut ${name}, commençons`,
      pitch:
        "Le meilleur moment pour prospecter : je peux prioriser vos leads, préparer vos accroches et lancer les relances avant votre premier appel.",
    };
  }
  if (h >= 12 && h < 18) {
    return {
      slot: "afternoon",
      salutation: `Bonjour ${name}`,
      pitch:
        "Après-midi productif en vue. Je peux trier vos signaux chauds, préparer vos séquences et dégager du temps pour closer.",
    };
  }
  if (h >= 18 && h < 23) {
    return {
      slot: "evening",
      salutation: `Bonsoir ${name}`,
      pitch:
        "La journée s'achève : je peux analyser vos résultats, préparer vos séquences de demain et identifier les comptes à relancer.",
    };
  }
  return {
    slot: "night",
    salutation: `Encore debout, ${name} ?`,
    pitch:
      "Pendant que vos concurrents dorment, je peux lancer vos enrichissements, préparer vos listes et rédiger vos messages pour demain matin.",
  };
}

/* ------------------------------- Réponses -------------------------------- */

const rules: { test: RegExp; reply: (ctx: string) => string }[] = [
  {
    test: /séquence|sequence|cadence/i,
    reply: () =>
      "J'ai préparé une séquence en 5 étapes (J0 email, J2 LinkedIn, J4 relance courte, J7 appel, J11 breakup). Angle peer-to-peer, objets < 45 caractères. Je l'ajoute à vos séquences ?",
  },
  {
    test: /email|message|relance/i,
    reply: () =>
      "Voici une version resserrée : accroche sur le signal détecté, une seule preuve chiffrée, un CTA à faible friction. Gain estimé : +18 % de taux de réponse.",
  },
  {
    test: /cto|profil|icp|lead|prospect/i,
    reply: () =>
      "42 profils correspondent à ces critères, score moyen 8,4/10. 17 ont un signal actif (recrutement, levée, expansion). Je les trie par intent et lance l'enrichissement.",
  },
  {
    test: /levée|funding|financ/i,
    reply: () =>
      "18 comptes ont levé sur les 90 derniers jours. Fenêtre d'attaque optimale : 2 à 6 semaines après l'annonce. Je prépare la liste priorisée.",
  },
  {
    test: /analys|rapport|kpi|performance/i,
    reply: () =>
      "Sur 30 jours : 1 240 contacts touchés, 22,6 % d'ouverture, 6,1 % de réponse. Le canal appel surperforme de 2,3× sur les comptes > 200 salariés.",
  },
  {
    test: /workflow|automat/i,
    reply: () =>
      "Je peux décrire le workflow, mais son édition reste pilotée par l'IA dédiée au canvas. Voulez-vous que je résume les blocs actifs et leurs conditions ?",
  },
  {
    test: /résume|resume|synthès|synthes/i,
    reply: (ctx) =>
      `Synthèse de ${ctx} : 3 éléments demandent une action aujourd'hui, 2 signaux chauds à traiter avant 48 h, et 1 tâche en retard. Je détaille ?`,
  },
];

export function generateReply(prompt: string, ctx: string, attachments: AssistantAttachment[]) {
  if (attachments.length > 0) {
    const images = attachments.filter((a) => a.kind === "image").length;
    const docs = attachments.filter((a) => a.kind === "document").length;
    const contexts = attachments.filter((a) => a.kind === "context").length;

    const parts: string[] = [];
    if (images) parts.push(`${images} image${images > 1 ? "s" : ""}`);
    if (docs) parts.push(`${docs} document${docs > 1 ? "s" : ""}`);
    if (contexts) parts.push(`${contexts} contexte${contexts > 1 ? "s" : ""}`);

    return `J'ai analysé ${parts.join(", ")}. J'en extrais les entités clés (sociétés, contacts, montants) et je les rapproche de vos données ${ctx}. Souhaitez-vous que je crée les enregistrements correspondants ?`;
  }
  const rule = rules.find((r) => r.test.test(prompt));
  if (rule) return rule.reply(ctx);
  return `Compris. Dans le contexte « ${ctx} », voici ce que je propose : 1) clarifier l'objectif, 2) isoler les 10 % d'actions à fort impact, 3) exécuter et mesurer. Dites-moi par quoi on commence.`;
}

/* ─── Parsing des messages (blocs de code + tableaux) ──────────────────── */

export type TableAlign = "left" | "center" | "right";

export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "table"; headers: string[]; rows: string[][]; align?: TableAlign[] };

function splitTableRow(line: string): string[] {
  const t = line.trim();
  const inner = t.startsWith("|") ? t.slice(1) : t;
  const stripped = inner.endsWith("|") ? inner.slice(0, -1) : inner;
  return stripped.split("|").map((c) => c.trim());
}

function parseTableAlign(sep: string, cols: number): TableAlign[] {
  const cells = splitTableRow(sep);
  const out: TableAlign[] = [];
  for (let i = 0; i < cols; i++) {
    const c = cells[i] ?? "";
    const left = c.startsWith(":");
    const right = c.endsWith(":");
    if (left && right) out.push("center");
    else if (right) out.push("right");
    else out.push("left");
  }
  return out;
}

/**
 * Découpe un texte de message en segments (texte brut, blocs de code
 * délimités par des fences ```, tableaux Markdown). Conçu pour être léger
 * et sans dépendance : pas de parseur Markdown complet, seulement les deux
 * structures qui profitent d'un rendu dédié dans l'interface de chat.
 */
export function parseMessageSegments(text: string): MessageSegment[] {
  if (!text) return [];
  const lines = text.split("\n");
  const segments: MessageSegment[] = [];
  let buffer: string[] = [];
  let i = 0;

  const flushText = () => {
    if (!buffer.length) return;
    const joined = buffer.join("\n");
    if (joined.trim()) segments.push({ type: "text", content: joined });
    buffer = [];
  };

  while (i < lines.length) {
    const line = lines[i]!;

    // Bloc de code
    const fence = /^```([\w+#-]*)\s*$/.exec(line);
    if (fence) {
      flushText();
      const lang = (fence[1] || "text").toLowerCase();
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i]!)) {
        code.push(lines[i]!);
        i++;
      }
      i++; // saute la fence fermante
      segments.push({ type: "code", language: lang, content: code.join("\n") });
      continue;
    }

    // Tableau Markdown : entête avec pipes, puis séparateur |---|---|
    const next = lines[i + 1];
    if (
      line.includes("|") &&
      next &&
      /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(next)
    ) {
      flushText();
      const headers = splitTableRow(line);
      const align = parseTableAlign(next, headers.length);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.includes("|") && lines[i]!.trim() !== "") {
        rows.push(splitTableRow(lines[i]!));
        i++;
      }
      segments.push({ type: "table", headers, rows, align });
      continue;
    }

    buffer.push(line);
    i++;
  }
  flushText();
  return segments;
}

/* ─── Feedback (persistance locale) ────────────────────────────────────── */

export type FeedbackValue = "up" | "down" | null;

export type FeedbackEntry = {
  hash: string;
  role: "user" | "agent";
  value: FeedbackValue;
  snippet: string;
  at: number;
};

const FEEDBACK_KEY = "lc.assistant.feedback.v1";

/**
 * Hash stable d'un message pour retrouver son feedback au fil des
 * sessions : même rôle + même texte = même hash (FNV-1a 32 bits).
 */
export function hashMessage(text: string, role: "user" | "agent"): string {
  const seed = `${role}:${text.trim()}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function loadFeedback(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}

export function persistFeedback(entry: FeedbackEntry): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadFeedback().filter((e) => e.hash !== entry.hash);
    all.push(entry);
    // On garde les 500 dernières entrées pour ne pas gonfler le stockage.
    const trimmed = all.slice(-500);
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
  } catch {
    /* Intentionally ignored. */
  }
}

export function getFeedbackValue(hash: string): FeedbackValue {
  const found = loadFeedback().find((e) => e.hash === hash);
  return found?.value ?? null;
}

/**
 * Calcule une indication textuelle sur les préférences de l'utilisateur,
 * à injecter plus tard dans le prompt système du modèle.
 * Renvoie une chaîne vide tant qu'on n'a pas assez de signaux fiables.
 */
export function getPersonalizationHint(): string {
  const entries = loadFeedback().filter((e) => e.role === "agent" && e.value !== null);
  if (entries.length < 5) return "";
  const ups = entries.filter((e) => e.value === "up").length;
  const downs = entries.filter((e) => e.value === "down").length;
  const ratio = ups / (ups + downs);
  if (ratio >= 0.75) return "L'utilisateur préfère des réponses concises et structurées.";
  if (ratio <= 0.3) return "L'utilisateur préfère des réponses plus détaillées et explicatives.";
  return "";
}