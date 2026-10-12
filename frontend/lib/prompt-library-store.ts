//frontend\lib\prompt-library-store.ts
/**
 * Bibliothèque de prompts + historique des prompts récents.
 *
 * Deux collections séparées, toutes deux persistées :
 *
 *  - `templates` : prompts réutilisables créés par l'utilisateur. Chaque
 *    entrée porte un titre court, un corps, et un tag facultatif (page
 *    cible) pour filtrer par contexte.
 *  - `recents`   : les N derniers prompts réellement envoyés, dédupliqués
 *    par texte normalisé. Utilisé pour la reprise rapide dans le champ.
 *
 * Volontairement indépendant du store de conversations : supprimer une
 * conversation ne doit jamais effacer les templates ni l'historique global
 * des prompts.
 */

const TEMPLATES_KEY = "lc.assistant.prompt-templates.v1";
const RECENTS_KEY = "lc.assistant.prompt-recents.v1";

const MAX_TEMPLATES = 200;
const MAX_RECENTS = 30;

export type PromptTemplate = {
  id: string;
  title: string;
  body: string;
  /** Étiquette libre (ex. nom de page, rôle) ; `null` = universel. */
  tag: string | null;
  createdAt: number;
  updatedAt: number;
};

export type RecentPrompt = {
  text: string;
  at: number;
  /** Contexte de page au moment de l'envoi (peut être vide). */
  ctx?: string;
};

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Intentionally ignored. */
  }
}

/* ─── Templates ───────────────────────────────────────────────────────── */

export function loadTemplates(): PromptTemplate[] {
  if (typeof window === "undefined") return [];
  return safeParseArray<PromptTemplate>(
    window.localStorage.getItem(TEMPLATES_KEY),
  ).filter((t) => t && typeof t.id === "string" && typeof t.body === "string");
}

export function saveTemplates(list: PromptTemplate[]): void {
  const trimmed = [...list]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_TEMPLATES);
  writeJson(TEMPLATES_KEY, trimmed);
}

export function createTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function upsertTemplate(tpl: PromptTemplate): PromptTemplate[] {
  const all = loadTemplates().filter((t) => t.id !== tpl.id);
  all.unshift(tpl);
  saveTemplates(all);
  return all;
}

export function deleteTemplate(id: string): PromptTemplate[] {
  const next = loadTemplates().filter((t) => t.id !== id);
  saveTemplates(next);
  return next;
}

/* ─── Récents ─────────────────────────────────────────────────────────── */

export function loadRecents(): RecentPrompt[] {
  if (typeof window === "undefined") return [];
  return safeParseArray<RecentPrompt>(window.localStorage.getItem(RECENTS_KEY)).filter(
    (r) => r && typeof r.text === "string",
  );
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function pushRecent(text: string, ctx?: string): RecentPrompt[] {
  const value = text.trim();
  if (!value) return loadRecents();
  const key = normalize(value);
  const filtered = loadRecents().filter((r) => normalize(r.text) !== key);
  const next: RecentPrompt[] = [
    { text: value, at: Date.now(), ...(ctx ? { ctx } : {}) },
    ...filtered,
  ].slice(0, MAX_RECENTS);
  writeJson(RECENTS_KEY, next);
  return next;
}

export function clearRecents(): void {
  writeJson(RECENTS_KEY, []);
}

/* ─── Recherche / filtrage ────────────────────────────────────────────── */

export function filterTemplates(
  list: PromptTemplate[],
  query: string,
  tag?: string | null,
): PromptTemplate[] {
  const needle = query.trim().toLowerCase();
  return list.filter((t) => {
    if (tag && t.tag && t.tag !== tag) return false;
    if (!needle) return true;
    return (
      t.title.toLowerCase().includes(needle) || t.body.toLowerCase().includes(needle)
    );
  });
}

/** Petit helper d'affichage : tronque le corps d'un template à N chars. */
export function previewBody(body: string, max = 90): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}