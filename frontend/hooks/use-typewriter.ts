// frontend/hooks/use-typewriter.ts

import { useEffect, useRef, useState } from "react";

export type TypewriterOptions = {
  enabled?: boolean;
  charsPerTick?: number;
  tickMs?: number;
};

export function useTypewriter(
  target: string,
  { enabled = true, charsPerTick = 3, tickMs = 16 }: TypewriterOptions = {},
): string {
  const [shown, setShown] = useState<string>(enabled ? "" : target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setShown(target);
      return;
    }
    if (!target) {
      setShown("");
      return;
    }
    let idx = 0;
    let last = performance.now();
    setShown("");

    const step = (now: number) => {
      const dt = now - last;
      if (dt >= tickMs) {
        last = now;
        idx = Math.min(target.length, idx + charsPerTick);
        setShown(target.slice(0, idx));
      }
      if (idx < target.length) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [target, enabled, charsPerTick, tickMs]);

  return shown;
}
