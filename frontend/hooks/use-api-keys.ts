// frontend/hooks/use-api-keys.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  API_KEYS_STORAGE_KEY,
  getKeyStatus,
  isKeyUsable,
  loadApiKeys,
  saveApiKeys,
  usableProviders,
  type ApiKeyStatus,
  type ApiProvider,
  type StoredApiKey,
} from "@/components/ai-assistant/model-selector-types";

const KEYS_CHANGED_EVENT = "lc:api-keys-changed";
const MAX_REVOKED_HISTORY = 10;

export type NewApiKeyInput = {
  provider: ApiProvider;
  apiKey: string;
  label?: string;
};

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function revokeOne(k: StoredApiKey): StoredApiKey {
  if (getKeyStatus(k) === "revoked") return k;
  return {
    ...k,
    apiKey: "",
    status: "revoked",
    revokedAt: Date.now(),
    hint: k.apiKey.slice(-4) || k.hint,
  };
}

function trimHistory(list: StoredApiKey[]): StoredApiKey[] {
  const revoked = list
    .filter((k) => getKeyStatus(k) === "revoked")
    .sort((a, b) => (b.revokedAt ?? 0) - (a.revokedAt ?? 0));
  const keep = new Set(revoked.slice(0, MAX_REVOKED_HISTORY).map((k) => k.id));
  return list.filter((k) => getKeyStatus(k) !== "revoked" || keep.has(k.id));
}

export function useApiKeys() {
  const [keys, setKeys] = useState<StoredApiKey[]>(() => loadApiKeys());

  useEffect(() => {
    const refresh = () => setKeys(loadApiKeys());
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === API_KEYS_STORAGE_KEY) refresh();
    };
    window.addEventListener(KEYS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(KEYS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const commit = useCallback((updater: (current: StoredApiKey[]) => StoredApiKey[]) => {
    const next = updater(loadApiKeys());
    saveApiKeys(next);
    setKeys(next);
    window.dispatchEvent(new Event(KEYS_CHANGED_EVENT));
  }, []);

  const addKey = useCallback(
    (input: NewApiKeyInput) => {
      commit((cur) => [
        ...cur,
        {
          id: makeId(),
          provider: input.provider,
          apiKey: input.apiKey.trim(),
          label: input.label?.trim() || undefined,
          status: "active",
          createdAt: Date.now(),
        },
      ]);
    },
    [commit],
  );

  const replaceKey = useCallback(
    (id: string, input: { apiKey: string; label?: string }) => {
      commit((cur) =>
        cur.map((k) =>
          k.id === id
            ? {
                ...k,
                apiKey: input.apiKey.trim(),
                label: input.label?.trim() || undefined,
                status: "active" as ApiKeyStatus,
                createdAt: Date.now(),
                lastUsedAt: undefined,
                revokedAt: undefined,
                hint: undefined,
              }
            : k,
        ),
      );
    },
    [commit],
  );

  const setStatus = useCallback(
    (id: string, status: Exclude<ApiKeyStatus, "revoked">) => {
      commit((cur) => cur.map((k) => (k.id === id ? { ...k, status } : k)));
    },
    [commit],
  );

  const revokeKey = useCallback(
    (id: string) => {
      commit((cur) => trimHistory(cur.map((k) => (k.id === id ? revokeOne(k) : k))));
    },
    [commit],
  );

  const revokeAll = useCallback(() => {
    commit((cur) => trimHistory(cur.map(revokeOne)));
  }, [commit]);

  const forgetKey = useCallback(
    (id: string) => {
      commit((cur) => cur.filter((k) => k.id !== id));
    },
    [commit],
  );

  const clearHistory = useCallback(() => {
    commit((cur) => cur.filter((k) => getKeyStatus(k) !== "revoked"));
  }, [commit]);

  const derived = useMemo(() => {
    const live = keys.filter((k) => getKeyStatus(k) !== "revoked");
    const revoked = keys
      .filter((k) => getKeyStatus(k) === "revoked")
      .sort((a, b) => (b.revokedAt ?? 0) - (a.revokedAt ?? 0));
    return {
      live,
      revoked,
      activeCount: keys.filter(isKeyUsable).length,
      pausedCount: live.filter((k) => getKeyStatus(k) === "paused").length,
      providers: usableProviders(keys),
    };
  }, [keys]);

  return {
    keys,
    liveKeys: derived.live,
    revokedKeys: derived.revoked,
    activeCount: derived.activeCount,
    pausedCount: derived.pausedCount,
    usableProviders: derived.providers,
    hasUsableKey: derived.activeCount > 0,
    addKey,
    replaceKey,
    setStatus,
    revokeKey,
    revokeAll,
    forgetKey,
    clearHistory,
  };
}
