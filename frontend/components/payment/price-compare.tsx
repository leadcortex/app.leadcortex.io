// frontend/components/payment/price-compare.tsx

import type { ReactNode } from "react";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";
import {
  ApolloLogo,
  ClayLogo,
  HunterLogo,
  LemlistLogo,
} from "@/components/marketing/pricing-logos";
import { CoinStack } from "@/components/payment/coin-stack";
import { cn } from "@/lib/core/utils";
import { PLANS } from "@/lib/data/pricing-strategy";
import { eur } from "@/lib/payment/order";

const PRICES_AS_OF = "janvier 2026";

type Entry = {
  id: string;
  label: string;
  price: number;
  note?: string;
  logo: ReactNode;
  self?: boolean;
};

const OWN_PRICE = PLANS[0]!.monthlyPrice;

const ENTRIES: Entry[] = (
  [
    { id: "clay", label: "Clay", price: 149, logo: <ClayLogo className="size-6" /> },
    { id: "lemlist", label: "Lemlist", price: 59, logo: <LemlistLogo className="size-6" /> },
    {
      id: "apollo",
      label: "Apollo",
      price: 49,
      logo: <ApolloLogo className="size-6" />,
    },
    { id: "hunter", label: "Hunter", price: 34, logo: <HunterLogo className="size-6" /> },
    {
      id: "leadcortex",
      label: "LeadCortex",
      price: OWN_PRICE,
      self: true,
      logo: <BrandLogoMark aria-label="" size={24} className="text-foreground" />,
    },
  ] satisfies Entry[]
).sort((a, b) => b.price - a.price);

export function PriceCompare() {
  const priciest = ENTRIES[0]!;
  const saving = Math.floor(priciest.price - OWN_PRICE);

  return (
    <div>
      <div className="flex items-end gap-1.5 md:gap-3">
        {ENTRIES.map((e, i) => (
          <div key={e.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex h-[150px] w-full items-end justify-center">
              <CoinStack
                amount={e.price}
                baseline={OWN_PRICE}
                tone={e.self ? "primary" : "muted"}
                delay={i * 80}
                max={15}
                className="w-9 md:w-12"
              />
            </div>
            <div className="mt-3 flex h-6 items-center">{e.logo}</div>
            <p
              className={cn(
                "mt-1.5 truncate text-[11px]",
                e.self ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {e.label}
            </p>
            <p
              className={cn(
                "mt-0.5 tabular-nums tracking-tight",
                e.self
                  ? "text-[22px] font-extrabold leading-none text-primary md:text-[26px]"
                  : "text-[13px] font-medium text-muted-foreground",
              )}
            >
              {eur(e.price)}
            </p>
            {e.note && <p className="text-[9px] text-muted-foreground/70">{e.note}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-surface/50 px-4 py-3">
        <p className="text-sm">
          Jusqu'à <strong className="text-lg font-extrabold tabular-nums">{saving} €</strong> de
          moins par mois que {priciest.label}.
        </p>
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block size-2 rounded-[2px] bg-destructive/35" />= ce que vous
          payez en plus
        </p>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Prix d'entrée mensuels constatés en {PRICES_AS_OF}. Marques citées : propriété de leurs
        détenteurs respectifs.
      </p>
    </div>
  );
}
