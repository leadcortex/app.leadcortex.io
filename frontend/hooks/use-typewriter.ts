//frontend\hooks\use-typewriter.ts
import { useEffect, useRef, useState } from "react";

export type TypewriterOptions = {
  /** `false` = texte affiché d'un coup (aucune animation). */
  enabled?: boolean;
  /** Nombre de caractères révélés par frame (défaut : 3). */
  charsPerTick?: number;
  /** Intervalle entre deux révélations en ms (défaut : 16 ≈ 60 fps). */
  tickMs?: number;
};

/**
 * Effet machine à écrire piloté par `requestAnimationFrame`.
 *
 * Comportement :
 *  - `enabled === false` → le texte complet est rendu immédiatement.
 *  - `enabled === true`  → le texte est révélé progressivement, à raison de
 *    `charsPerTick` caractères toutes les `tickMs` millisecondes.
 *
 * Le hook redémarre proprement quand `target` change (nouveau message) et
 * s'arrête tout seul une fois la cible atteinte.
 */
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