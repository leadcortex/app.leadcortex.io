// frontend/lib/consent/consent-store.ts

import { useSyncExternalStore } from "react";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
  OPTIONAL_CATEGORIES,
  enabledCategories,
  type ConsentCategoryId,
} from "./consent-config";

export type ConsentChoices = Record<ConsentCategoryId, boolean>;

export type ConsentState = {
  ready: boolean;
  decided: boolean;
  choices: ConsentChoices;
  decidedAt: number | null;
  panelOpen: boolean;
};

type StoredConsent = {
  v: number;
  ts: number;
  choices: Partial<ConsentChoices>;
};

export const CONSENT_EVENT = "lc:consent-change";

function emptyChoices(): ConsentChoices {
  const choices = {} as ConsentChoices;
  for (const category of OPTIONAL_CATEGORIES) choices[category.id] = false;
  return choices;
}

function normalizeChoices(input?: Partial<ConsentChoices>): ConsentChoices {
  const choices = emptyChoices();
  for (const category of enabledCategories()) {
    choices[category.id] = input?.[category.id] === true;
  }
  return choices;
}

const SERVER_STATE: ConsentState = {
  ready: false,
  decided: false,
  choices: emptyChoices(),
  decidedAt: null,
  panelOpen: false,
};

let state: ConsentState = SERVER_STATE;
const listeners = new Set<() => void>();

function setState(next: ConsentState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) return null;
  for (const part of document.cookie.split("; ")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index) !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function expireCookie(name: string) {
  const host = window.location.hostname;
  const labels = host.split(".");
  const domains = new Set<string>(["", host, `.${host}`]);
  for (let i = 1; i < labels.length - 1; i += 1) {
    domains.add(`.${labels.slice(i).join(".")}`);
  }
  for (const domain of domains) {
    const domainPart = domain ? `; Domain=${domain}` : "";
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domainPart}`;
  }
}

function purgeCookiesByPrefix(prefixes: string[]) {
  if (typeof document === "undefined" || prefixes.length === 0 || !document.cookie) return;
  const names = document.cookie
    .split("; ")
    .map((part) => part.split("=")[0])
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)));
  names.forEach(expireCookie);
}

function readStored(): StoredConsent | null {
  const raw = readCookie(CONSENT_COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.v !== CONSENT_VERSION || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CONSENT_MAX_AGE_SECONDS * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(choices: ConsentChoices) {
  const ts = Date.now();
  const stored: StoredConsent = { v: CONSENT_VERSION, ts, choices };
  writeCookie(CONSENT_COOKIE_NAME, JSON.stringify(stored), CONSENT_MAX_AGE_SECONDS);

  for (const category of OPTIONAL_CATEGORIES) {
    if (!choices[category.id]) purgeCookiesByPrefix(category.cookiePrefixes);
  }

  setState({ ready: true, decided: true, choices, decidedAt: ts, panelOpen: false });
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { choices, decidedAt: ts } }));
}

export function initConsent() {
  if (typeof window === "undefined" || state.ready) return;
  const stored = readStored();
  setState({
    ready: true,
    decided: stored !== null,
    choices: normalizeChoices(stored?.choices),
    decidedAt: stored?.ts ?? null,
    panelOpen: false,
  });
}

export function acceptAll() {
  const choices = emptyChoices();
  for (const category of enabledCategories()) choices[category.id] = true;
  persist(choices);
}

export function rejectAll() {
  persist(emptyChoices());
}

export function savePreferences(input: Partial<ConsentChoices>) {
  persist(normalizeChoices(input));
}

export function openConsentPreferences() {
  initConsent();
  setState({ ...state, ready: true, panelOpen: true });
}

export function closeConsentPreferences() {
  setState({ ...state, panelOpen: false });
}

export function hasConsent(id: ConsentCategoryId): boolean {
  return state.ready && state.choices[id] === true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConsentState {
  return state;
}

function getServerSnapshot(): ConsentState {
  return SERVER_STATE;
}

export function useConsentState(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHasConsent(id: ConsentCategoryId): boolean {
  const consent = useConsentState();
  return consent.ready && consent.choices[id] === true;
}
