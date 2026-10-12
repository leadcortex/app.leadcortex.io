//frontend\lib\workflow\use-auto-pan.ts
import { useEffect, useRef } from "react";
import type { Viewport } from "./types";

export type AutoPanPointer = { x: number; y: number; type: string } | null;

type Options = {
  active: boolean;

  containerRef: React.RefObject<HTMLElement | null>;

  pointerRef: React.MutableRefObject<AutoPanPointer>;
  setViewport: (updater: (v: Viewport) => Viewport) => void;

  onPan?: () => void;
};

/** Largeur de la zone tampon (px) à l'intérieur de chaque bord du viewport. */
const EDGE_MOUSE = 44;
const EDGE_TOUCH = 64;

const MAX_SPEED = 1100;
/** Bornes de temps entre deux frames pour éviter les sauts (onglet en arrière-plan). */
const MAX_DT = 0.032;

export function useAutoPan({ active, containerRef, pointerRef, setViewport, onPan }: Options) {
  const onPanRef = useRef(onPan);
  onPanRef.current = onPan;

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(MAX_DT, (now - last) / 1000);
      last = now;

      const p = pointerRef.current;
      if (!p) return;
      const r = el.getBoundingClientRect();
      const edge = p.type === "touch" ? EDGE_TOUCH : EDGE_MOUSE;

      const intensity = (distance: number) =>
        distance >= edge ? 0 : Math.min(1, (edge - distance) / edge) ** 2;

      const left = intensity(p.x - r.left);
      const right = intensity(r.right - p.x);
      const top = intensity(p.y - r.top);
      const bottom = intensity(r.bottom - p.y);

      const dx = (left - right) * MAX_SPEED * dt;
      const dy = (top - bottom) * MAX_SPEED * dt;
      if (!dx && !dy) return;

      setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      onPanRef.current?.();
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, containerRef, pointerRef, setViewport]);
}
