// academy/src/lib/dictionary-store.ts

import { useCallback, useEffect, useState } from "react";

import { gemsApi } from "./gems-store";

const STORAGE_KEY = "academy:unlocked-terms:v1";
const EVENT_KEY = "academy:unlocked-terms-changed";

export const DICTIONARY_COST_PER_TERM = 3;

export function termId(term: string): string {
  return term.trim().toLowerCase();
}

function readUnlocked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function writeUnlocked(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: ids }));
  } catch {
  }
}

export const dictionaryApi = {
  list: readUnlocked,
  isUnlocked(term: string): boolean {
    return readUnlocked().includes(termId(term));
  },
  unlock(term: string): boolean {
    const id = termId(term);
    const current = readUnlocked();
    if (current.includes(id)) return false;
    if (!gemsApi.spend(DICTIONARY_COST_PER_TERM)) return false;
    writeUnlocked([...current, id]);
    return true;
  },
  reset(): void {
    writeUnlocked([]);
  },
};

export type UseDictionaryResult = {
  unlockedIds: string[];
  isUnlocked: (term: string) => boolean;
  unlock: (term: string) => boolean;
  cost: number;
  reset: () => void;
};

export function useDictionary(): UseDictionaryResult {
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => readUnlocked());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) setUnlockedIds(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setUnlockedIds(readUnlocked());
    };
    window.addEventListener(EVENT_KEY, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_KEY, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isUnlocked = useCallback(
    (term: string) => unlockedIds.includes(termId(term)),
    [unlockedIds],
  );
  const unlock = useCallback((term: string) => dictionaryApi.unlock(term), []);
  const reset = useCallback(() => dictionaryApi.reset(), []);

  return {
    unlockedIds,
    isUnlocked,
    unlock,
    cost: DICTIONARY_COST_PER_TERM,
    reset,
  };
}
