//frontend\lib\pinned-messages-store.ts
/**
 * Épingles de messages — stockage séparé du reste.
 *
 * Les épingles sont indexées **par conversation** (id) et stockent l'id du
 * message épinglé. Ce découplage évite de toucher au schéma de
 * `AssistantMessage` : le jour où on bascule vers un vrai backend, il suffira
 * de déplacer cette map côté serveur sans réécrire le composant de chat.
 *
 * Volontairement borné : 20 épingles max par conversation.
 */

const STORAGE_KEY = "lc.assistant.pins.v1";
const MAX_PER_CONVERSATION = 20;

type PinMap = Record<string, string[]>;

function readAll(): PinMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: PinMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        out[k] = v.filter((x): x is string => typeof x === "string");
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: PinMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* Intentionally ignored. */
  }
}

export function loadPins(conversationId: string): string[] {
  return readAll()[conversationId] ?? [];
}

export function togglePin(conversationId: string, messageId: string): string[] {
  const all = readAll();
  const current = all[conversationId] ?? [];
  const has = current.includes(messageId);
  const next = has
    ? current.filter((id) => id !== messageId)
    : [messageId, ...current].slice(0, MAX_PER_CONVERSATION);
  all[conversationId] = next;
  writeAll(all);
  return next;
}

export function clearPins(conversationId: string): void {
  const all = readAll();
  delete all[conversationId];
  writeAll(all);
}

export function isPinned(conversationId: string, messageId: string): boolean {
  return (readAll()[conversationId] ?? []).includes(messageId);
}