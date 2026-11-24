// frontend/hooks/use-virtual-keyboard.ts

import { useEffect, useRef, useState } from "react";

const KEYBOARD_OPEN_THRESHOLD = 150;

const REMEASURE_DELAYS = [50, 150, 350, 600];

export function useVirtualKeyboard() {
  const [inset, setInset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window === "undefined" ? 800 : window.innerHeight,
  );

  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const measure = () => {
      const diff = window.innerHeight - vv.height - vv.offsetTop;
      const next = Math.max(0, Math.round(diff));
      setInset(next);
      setIsOpen(next > KEYBOARD_OPEN_THRESHOLD);
      setViewportHeight(Math.round(vv.height));
    };

    const scheduleMeasure = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    const onFocusOut = () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = REMEASURE_DELAYS.map((delay) => window.setTimeout(measure, delay));
    };

    vv.addEventListener("resize", scheduleMeasure);
    vv.addEventListener("scroll", scheduleMeasure);
    document.addEventListener("focusout", onFocusOut);
    measure();

    return () => {
      vv.removeEventListener("resize", scheduleMeasure);
      vv.removeEventListener("scroll", scheduleMeasure);
      document.removeEventListener("focusout", onFocusOut);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return { inset, isOpen, viewportHeight };
}

export function useKeyboardInset() {
  return useVirtualKeyboard().inset;
}
