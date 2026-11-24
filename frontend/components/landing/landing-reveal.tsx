// frontend/components/landing/landing-reveal.tsx

import type * as React from "react";
import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && (setV(true), io.disconnect()),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, v] as const;
}

export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, visible] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`lc-reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
