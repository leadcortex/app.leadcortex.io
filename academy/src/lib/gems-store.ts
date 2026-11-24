// academy/src/lib/gems-store.ts

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "academy:gems:v1";
const EVENT_KEY = "academy:gems-changed";

function readBalance(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeBalance(value: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.floor(value));
  try {
    window.localStorage.setItem(STORAGE_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: clamped }));
  } catch {
  }
}

export const gemsApi = {
  getBalance: readBalance,
  add(amount: number): number {
    const next = readBalance() + Math.max(0, Math.floor(amount));
    writeBalance(next);
    return next;
  },
  spend(amount: number): boolean {
    const current = readBalance();
    const cost = Math.max(0, Math.floor(amount));
    if (current < cost) return false;
    writeBalance(current - cost);
    return true;
  },
  canAfford(amount: number): boolean {
    return readBalance() >= Math.max(0, Math.floor(amount));
  },
  reset(): void {
    writeBalance(0);
  },
};

export type UseGemsResult = {
  balance: number;
  add: (amount: number) => number;
  spend: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
  reset: () => void;
};

export function useGems(): UseGemsResult {
  const [balance, setBalance] = useState<number>(() => readBalance());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") setBalance(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setBalance(readBalance());
    };
    window.addEventListener(EVENT_KEY, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_KEY, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const add = useCallback((amount: number) => gemsApi.add(amount), []);
  const spend = useCallback((amount: number) => gemsApi.spend(amount), []);
  const canAfford = useCallback((amount: number) => gemsApi.canAfford(amount), []);
  const reset = useCallback(() => gemsApi.reset(), []);

  return { balance, add, spend, canAfford, reset };
}
