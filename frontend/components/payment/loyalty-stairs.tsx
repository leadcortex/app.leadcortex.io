// frontend/components/payment/loyalty-stairs.tsx

import { useState } from "react";
import { cn } from "@/lib/core/utils";
import {
  LOYALTY_CAP_LABEL,
  LOYALTY_MAX_MONTHS,
  formatEur,
  loyaltyDiscount,
  loyaltyPrice,
} from "@/lib/data/pricing-strategy";
import { eur } from "@/lib/payment/order";

type Props = {
  basePrice: number;
  months: number;
  planName: string;
};

const STEPS = Array.from({ length: LOYALTY_MAX_MONTHS + 1 }, (_, i) => i);
const STAIR_H = 96;

export function LoyaltyStairs({ basePrice, months, planName }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? months;
  const price = loyaltyPrice(basePrice, shown);
  const pct = Math.round(loyaltyDiscount(shown) * 100);

  return (
    <div className="grid items-end gap-5 rounded-2xl bg-surface/50 p-4 md:grid-cols-[minmax(0,220px)_1fr] md:gap-8 md:p-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {hover === null ? `Vous, ${planName}` : `Au mois ${shown}`}
        </p>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[44px] font-extrabold leading-none tabular-nums tracking-tighter">
            {formatEur(price)}
            <span className="ml-0.5 text-[22px] font-semibold">€</span>
          </span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="text-muted-foreground line-through">{eur(basePrice)}</span>
          {pct > 0 && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
              −{pct} %
            </span>
          )}
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Chaque mois, votre prix descend d'une marche. Automatique, jusqu'à{" "}
          <strong className="font-semibold text-foreground">
            {LOYALTY_CAP_LABEL.replace("-", "−")}
          </strong>
          .
        </p>
      </div>

      <div>
        <div
          className="flex items-end gap-1 md:gap-1.5"
          style={{ height: STAIR_H }}
          onMouseLeave={() => setHover(null)}
        >
          {STEPS.map((i) => {
            const reached = i <= months;
            const current = i === months;
            const h = STAIR_H - i * 5.5;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Mois ${i} : ${eur(loyaltyPrice(basePrice, i))}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "block w-full rounded-t-md border transition-all duration-300",
                    reached
                      ? "border-primary bg-primary"
                      : "border-dashed border-foreground/25 bg-transparent group-hover:border-primary/60",
                    reached && !current && "opacity-45",
                    hover === i && "ring-2 ring-primary/30",
                  )}
                  style={{ height: h }}
                />
                {current && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold text-background">
                    Vous
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>Mois 0</span>
          <span>Mois {LOYALTY_MAX_MONTHS}</span>
        </div>
      </div>
    </div>
  );
}
