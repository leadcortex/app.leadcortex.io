// frontend/components/payment/coin-stack.tsx

import { useEffect, useState } from "react";
import { cn } from "@/lib/core/utils";

const COIN_H = 7;
const COIN_GAP = 2;

type Props = {
  amount: number;
  unit?: number;
  baseline?: number;
  tone?: "primary" | "muted";
  max?: number;
  delay?: number;
  className?: string;
};

export function CoinStack({
  amount,
  unit = 10,
  baseline,
  tone = "muted",
  max = 16,
  delay = 0,
  className,
}: Props) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const exact = Math.max(amount / unit, 0.2);
  const full = Math.min(Math.floor(exact), max);
  const hasPartial = exact - full > 0.05 && full < max;
  const count = full + (hasPartial ? 1 : 0);

  return (
    <div
      className={cn("flex flex-col-reverse items-center", className)}
      style={{ gap: COIN_GAP }}
      role="img"
      aria-label={`${Math.round(amount)} euros par mois`}
    >
      {Array.from({ length: count }, (_, i) => {
        const partial = hasPartial && i === count - 1;
        const excess = baseline !== undefined && i * unit >= baseline;
        return (
          <span
            key={i}
            className={cn(
              "block w-full rounded-[3px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              excess
                ? "bg-destructive/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
                : tone === "primary"
                  ? "bg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_1px_0_color-mix(in_oklab,var(--primary)_60%,black)]"
                  : "bg-foreground/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]",
              partial && "opacity-50",
            )}
            style={{
              height: COIN_H,
              opacity: shown ? (partial ? 0.5 : 1) : 0,
              transform: shown ? "translateY(0)" : "translateY(-14px)",
              transitionDelay: `${delay + i * 28}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
