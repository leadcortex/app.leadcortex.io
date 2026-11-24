// frontend/components/ui/animated-counter.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/core/utils";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function defaultFormat(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

export type AnimatedCounterProps = {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
};

export function AnimatedCounter({
  value,
  format = defaultFormat,
  duration = 900,
  delay = 0,
  className,
}: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState<number>(() =>
    prefersReducedMotion() ? value : 0,
  );
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayed(value);
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current - delay;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplayed(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay]);

  return (
    <span
      className={cn("counter-anim tabular-nums", className)}
      aria-label={defaultFormat(value)}
    >
      <span className="counter-anim__value">{format(displayed)}</span>
    </span>
  );
}

function parseCounterText(text: string): {
  prefix: string;
  number: number | null;
  decimals: number;
  suffix: string;
} | null {
  if (!text) return null;
  const m = text.match(
    /^(\s*[+\-±]?\s*)(\d{1,3}(?:[\s\u202f.,]\d{3})*|\d+)(?:[.,](\d+))?\s*(.*)$/,
  );
  if (!m) return null;
  const prefix = m[1] ?? "";
  const rawInt = (m[2] ?? "").replace(/[\s\u202f]/g, "").replace(/[.,](?=\d{3}\b)/g, "");
  const intPart = rawInt.replace(/[^\d]/g, "");
  const decPart = m[3] ?? "";
  const suffix = (m[4] ?? "").trim();
  const numeric = decPart ? parseFloat(`${intPart}.${decPart}`) : parseInt(intPart, 10);
  if (!Number.isFinite(numeric)) return null;
  return {
    prefix: prefix.trim() === "" ? "" : prefix.trim() + " ",
    number: numeric,
    decimals: decPart.length,
    suffix: suffix ? ` ${suffix}` : "",
  };
}

export type SmartCounterProps = {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
};

export function SmartCounter({
  text,
  duration = 900,
  delay = 0,
  className,
}: SmartCounterProps) {
  const parsed = parseCounterText(text);

  if (!parsed || parsed.number === null) {
    return <span className={className}>{text}</span>;
  }

  const { prefix, number, decimals, suffix } = parsed;

  return (
    <span className={cn("counter-anim tabular-nums", className)} aria-label={text}>
      {prefix}
      <AnimatedCounter
        value={number}
        duration={duration}
        delay={delay}
        format={(n) =>
          decimals > 0
            ? n.toLocaleString("fr-FR", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })
            : n.toLocaleString("fr-FR")
        }
      />
      {suffix}
    </span>
  );
}
