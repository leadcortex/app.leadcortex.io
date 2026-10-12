//frontend\components\ai-assistant\conversation-store.ts
import type { AssistantMessage } from "./assistant-engine";

export type Conversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "lc.assistant.conversations.v1";
const MAX_CONVERSATIONS = 60;
const TITLE_MAX = 42;

function safeParse(raw: string | null): Conversation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Conversation =>
        c && typeof c === "object" && typeof c.id === "string" && Array.isArray(c.messages),
    );
  } catch {
    return [];
  }
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  } catch {
    return [];
  }
}

/** Écrit la liste complète, en gardant les MAX_CONVERSATIONS plus récentes. */
function writeAll(list: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    /* Intentionally ignored. */
  }
}

/**
 * Enregistre (upsert) une conversation. Ne conserve que les messages dont
 * le texte est non vide — sinon on persiste des tours à moitié construits.
 */
export function saveConversation(conv: Conversation): void {
  const clean: Conversation = {
    ...conv,
    messages: conv.messages.filter((m) => m.text.trim().length > 0),
  };
  const all = loadConversations().filter((c) => c.id !== clean.id);
  all.unshift(clean);
  writeAll(all);
}

export function deleteConversation(id: string): void {
  const all = loadConversations().filter((c) => c.id !== id);
  writeAll(all);
}

export function clearAllConversations(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Intentionally ignored. */
  }
}

export function createConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Génère un titre court à partir du premier message utilisateur. Si aucun
 * prompt n'existe encore, on renvoie un libellé générique horodaté.
 */
export function deriveTitle(messages: AssistantMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.text.trim());
  if (!firstUser) {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `Conversation · ${hh}:${mm}`;
  }
  const text = firstUser.text.replace(/\s+/g, " ").trim();
  if (text.length <= TITLE_MAX) return text;
  return `${text.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

/** Formatte une date pour l'affichage dans la liste d'historique. */
export function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}