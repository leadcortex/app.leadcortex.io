//frontend\hooks\use-long-press.ts
// desktop. Remplace `onContextMenu` là où il ne fonctionne pas en tactile.

//   • expose `shouldIgnoreClick()` à appeler en début de onClick pour éviter

import { useCallback, useRef } from "react";

export type LongPressEvent = { clientX: number; clientY: number };

export type UseLongPressOptions = {
  onLongPress: (e: LongPressEvent) => void;

  delay?: number;

  moveTolerance?: number;

  haptic?: boolean;
};

export function useLongPress({
  onLongPress,
  delay = 480,
  moveTolerance = 10,
  haptic = true,
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      firedRef.current = false;
      startPosRef.current = { x: t.clientX, y: t.clientY };
      clear();
      timerRef.current = window.setTimeout(() => {
        firedRef.current = true;
        if (haptic && typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(12);
          } catch {
            /* Intentionally ignored. */
          }
        }
        const pos = startPosRef.current ?? { x: t.clientX, y: t.clientY };
        onLongPress({ clientX: pos.x, clientY: pos.y });
      }, delay);
    },
    [onLongPress, delay, haptic, clear],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startPosRef.current.x;
      const dy = t.clientY - startPosRef.current.y;
      if (Math.hypot(dx, dy) > moveTolerance) clear();
    },
    [clear, moveTolerance],
  );

  const handleTouchEnd = useCallback(() => clear(), [clear]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Si un long-press tactile vient de se déclencher, ne pas doubler.
      if (firedRef.current) return;
      onLongPress({ clientX: e.clientX, clientY: e.clientY });
    },
    [onLongPress],
  );

  const shouldIgnoreClick = useCallback(() => {
    if (firedRef.current) {
      firedRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onContextMenu: handleContextMenu,
    },
    shouldIgnoreClick,
  };
}
