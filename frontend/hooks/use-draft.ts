// frontend/hooks/use-draft.ts

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "lc.draft.v1.";
const WRITE_DELAY_MS = 300;

export function useDraft(key: string): [string, (value: string) => void] {
  const storageKey = `${PREFIX}${key}`;
  const [value, setValue] = useState("");
  const latest = useRef("");
  const timer = useRef<number | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        latest.current = raw;
        setValue(raw);
      }
    } catch {
    }
    loaded.current = true;
  }, [storageKey]);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (!loaded.current) return;
    try {
      if (latest.current) window.localStorage.setItem(storageKey, latest.current);
      else window.localStorage.removeItem(storageKey);
    } catch {
    }
  }, [storageKey]);

  const set = useCallback(
    (next: string) => {
      latest.current = next;
      setValue(next);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, WRITE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [flush]);

  return [value, set];
}
