// frontend/hooks/use-context-menu.ts

import { useCallback, useEffect, useRef, useState } from "react";

export type ContextMenuState<P> = {
  x: number;
  y: number;
  payload: P;
};

export type ContextMenuBindOptions = {
  longPressMs?: number;
  disabled?: boolean;
};

export type UseContextMenuOptions<P> = {
  onBeforeOpen?: (payload: P) => void;
};

export function useContextMenu<P = void>(options: UseContextMenuOptions<P> = {}) {
  const [state, setState] = useState<ContextMenuState<P> | null>(null);

  const onBeforeOpenRef = useRef(options.onBeforeOpen);
  onBeforeOpenRef.current = options.onBeforeOpen;

  const open = useCallback((x: number, y: number, payload: P) => {
    setState({ x, y, payload });
  }, []);

  const close = useCallback(() => setState(null), []);

  const bind = useCallback(
    (payload: P, bindOptions: ContextMenuBindOptions = {}) => {
      const longPressMs = bindOptions.longPressMs ?? 500;
      const disabled = bindOptions.disabled ?? false;

      return {
        onContextMenu: (e: React.MouseEvent) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          onBeforeOpenRef.current?.(payload);
          open(e.clientX, e.clientY, payload);
        },

        onPointerDown: (e: React.PointerEvent) => {
          if (disabled) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          const target = e.target as HTMLElement;
          if (target.closest("input, textarea, select, [contenteditable]")) return;

          const startX = e.clientX;
          const startY = e.clientY;
          let moved = false;

          const clear = () => {
            window.clearTimeout(timer);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
          };

          const onMove = (ev: PointerEvent) => {
            if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) {
              moved = true;
              clear();
            }
          };

          const onUp = () => {
            clear();
          };

          const timer = window.setTimeout(() => {
            if (moved) return;
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate(10);
              } catch {
              }
            }
            const swallow = (ev: Event) => {
              ev.preventDefault();
              ev.stopPropagation();
              window.removeEventListener("click", swallow, true);
            };
            window.addEventListener("click", swallow, true);
            window.setTimeout(() => window.removeEventListener("click", swallow, true), 400);
            onBeforeOpenRef.current?.(payload);
            open(startX, startY, payload);
          }, longPressMs);

          window.addEventListener("pointermove", onMove, { passive: true });
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        },
      };
    },
    [open],
  );

  useEffect(() => {
    if (!state) return;
    const onScroll = () => close();
    const onResize = () => close();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [state, close]);

  return { state, open, close, bind };
}
