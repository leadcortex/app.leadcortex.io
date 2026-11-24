// frontend/components/payment/plan-ladder.tsx

import { Check } from "@/components/icons";
import { CoinStack } from "@/components/payment/coin-stack";
import { cn } from "@/lib/core/utils";
import { PLANS, formatEur, type Plan, type PlanId } from "@/lib/data/pricing-strategy";
import { eur, type Cycle } from "@/lib/payment/order";

type Props = {
  cycle: Cycle;
  selected: PlanId;
  currentPlanId?: PlanId;
  onSelect: (id: PlanId) => void;
};

const LADDER: Plan[] = [...PLANS].sort((a, b) => b.monthlyPrice - a.monthlyPrice);

function monthlyEquivalent(plan: Plan, cycle: Cycle): number {
  return cycle === "annual" ? plan.annualMonthly : plan.monthlyPrice;
}

function PlanColumn({
  plan,
  cycle,
  active,
  current,
  index,
  onSelect,
}: {
  plan: Plan;
  cycle: Cycle;
  active: boolean;
  current: boolean;
  index: number;
  onSelect: () => void;
}) {
  const price = monthlyEquivalent(plan, cycle);
  const [euros, cents] = formatEur(price).split(",");
  const perDay = price / 30;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group relative flex min-w-0 flex-col rounded-2xl border p-3 text-left transition-all duration-300 md:p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-primary/50 bg-background shadow-[var(--shadow-float)] ring-1 ring-primary/20"
          : "border-transparent bg-surface/50 hover:bg-surface",
      )}
    >
      <div className="flex h-[112px] items-end justify-center pb-2">
        <CoinStack
          amount={price}
          tone={active ? "primary" : "muted"}
          delay={index * 90}
          className="w-9 md:w-11"
        />
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <p
          className={cn(
            "truncate text-[11px] uppercase tracking-[0.14em] transition-colors",
            active ? "font-bold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          {plan.name}
        </p>
        {current && (
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
            Actuel
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-1.5 flex items-baseline font-sans tabular-nums tracking-tighter transition-all duration-300",
          active
            ? "text-[40px] font-extrabold leading-none text-foreground md:text-[52px]"
            : "text-[28px] font-medium leading-none text-muted-foreground md:text-[34px]",
        )}
      >
        {euros}
        <span
          className={cn(
            "ml-px font-semibold tracking-normal",
            active ? "text-[18px] md:text-[22px]" : "text-[13px] md:text-[15px]",
          )}
        >
          ,{cents}
          <span className="ml-0.5">€</span>
        </span>
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        par mois
        {cycle === "annual" && (
          <span className="ml-1.5 text-muted-foreground/70 line-through">
            {formatEur(plan.monthlyPrice)}
          </span>
        )}
      </p>

      <p className="mt-3 text-[11px] text-muted-foreground">
        ≈ <span className="font-semibold text-foreground">{eur(perDay)}</span> par jour
      </p>

      <div className="mt-3 border-t border-border/70 pt-3">
        <p className={cn("text-[13px] leading-tight", active ? "font-bold" : "font-semibold")}>
          {plan.credits.toLocaleString("fr-FR")} crédits
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {plan.seats} utilisateur{plan.seats > 1 ? "s" : ""}
        </p>
        <ul className="mt-2.5 hidden space-y-1 md:block">
          {plan.highlights.slice(2, 4).map((h) => (
            <li key={h} className="flex items-start gap-1.5 text-[10.5px] leading-snug">
              <Check
                className={cn(
                  "mt-px size-3 shrink-0",
                  active ? "text-primary" : "text-muted-foreground/60",
                )}
              />
              <span className="text-muted-foreground">{h}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

export function PlanLadder({ cycle, selected, currentPlanId, onSelect }: Props) {
  return (
    <div>
      <div className="grid grid-cols-3 items-stretch gap-2 md:gap-3">
        {LADDER.map((plan, i) => (
          <PlanColumn
            key={plan.id}
            plan={plan}
            cycle={cycle}
            index={i}
            active={plan.id === selected}
            current={plan.id === currentPlanId}
            onSelect={() => onSelect(plan.id)}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        1 pièce = 10 € par mois · plus la pile est basse, moins vous payez
      </p>
    </div>
  );
}
