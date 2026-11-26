// frontend/components/payment/checkout/plan-picker.tsx

import { Check } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { PLANS, formatEur, type PlanId } from "@/lib/data/pricing-strategy";
import type { Cycle } from "@/lib/payment/order";

const ORDERED = [...PLANS].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
const POPULAR: PlanId = "founder";

export function CycleSwitch({
  cycle,
  onChange,
  badge,
}: {
  cycle: Cycle;
  onChange: (c: Cycle) => void;
  badge: string;
}) {
  const btn = (c: Cycle, label: React.ReactNode) => (
    <button
      type="button"
      role="radio"
      aria-checked={cycle === c}
      onClick={() => onChange(c)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        cycle === c
          ? "bg-background font-semibold text-foreground shadow-sm"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div
      role="radiogroup"
      aria-label="Fréquence de facturation"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface/80 p-1 shadow-[inset_0_0_0_1px_var(--border)]"
    >
      {btn("monthly", "Mensuel")}
      {btn(
        "annual",
        <>
          Annuel
          <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
            {badge}
          </span>
        </>,
      )}
    </div>
  );
}

export function PlanPicker({
  cycle,
  selected,
  onSelect,
}: {
  cycle: Cycle;
  selected: PlanId;
  onSelect: (id: PlanId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Forfait" className="grid grid-cols-1 gap-2">
      {ORDERED.map((plan) => {
        const active = plan.id === selected;
        const price = cycle === "annual" ? plan.annualMonthly : plan.monthlyPrice;
        const [euros, cents] = formatEur(price).split(",");
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(plan.id)}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary/60 bg-primary/[0.04] shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_14%,transparent)]"
                : "border-border hover:border-foreground/25",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {active && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">{plan.name}</span>
                {plan.id === POPULAR && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                    Populaire
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                {plan.credits.toLocaleString("fr-FR")} crédits · {plan.seats} utilisateur
                {plan.seats > 1 ? "s" : ""}
              </span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="text-[22px] font-extrabold leading-none tracking-tight">
                {euros}
              </span>
              <span className="text-[13px] font-semibold">,{cents} €</span>
              <span className="block text-[10.5px] text-muted-foreground">/ mois</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
