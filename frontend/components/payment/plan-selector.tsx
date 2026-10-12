//frontend\components\payment\plan-selector.tsx
import { Zap, Crown, Building2 } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    credits: 200,
    featured: false,
    icon: Zap,
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    id: "founder",
    name: "Founder",
    price: 15.99,
    credits: 1000,
    featured: true,
    icon: Crown,
    color: "from-primary/20 to-primary/10",
  },
  {
    id: "studio",
    name: "Studio",
    price: 19.99,
    credits: 5000,
    featured: false,
    icon: Building2,
    color: "from-purple-500/20 to-purple-600/10",
  },
];

interface PlanSelectorProps {
  selectedPlan: string;
  onSelectPlan: (id: string) => void;
}

export function PlanSelector({ selectedPlan, onSelectPlan }: PlanSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.id;
        const Icon = plan.icon;

        return (
          <button
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? `border-primary bg-primary/5 ${plan.color}`
                : "border-border hover:border-primary/30 hover:bg-surface/50"
            } ${plan.featured ? "ring-2 ring-primary/20" : ""}`}
          >
            {plan.featured && (
              <span className="absolute -top-2 right-3 text-[8px] font-bold uppercase tracking-wider bg-primary text-background px-2 py-0.5 rounded-full">
                Populaire
              </span>
            )}
            <Icon
              className={`size-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
            />
            <p className="font-semibold text-sm">{plan.name}</p>
            <p className="text-lg font-display mt-1">
              {plan.price}€<span className="text-xs font-normal text-muted-foreground">/mois</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{plan.credits} crédits/mois</p>
          </button>
        );
      })}
    </div>
  );
}
