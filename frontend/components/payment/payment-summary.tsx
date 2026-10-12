//frontend\components\payment\payment-summary.tsx
import { Check, Shield, Clock, Receipt } from "lucide-react";

interface PaymentSummaryProps {
  planName: string;
  price: number;
  isAnnual: boolean;
  features: string[];
}

export function PaymentSummary({ planName, price, isAnnual, features }: PaymentSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 sticky top-6">
      <h2 className="font-display text-2xl italic mb-4">Résumé</h2>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="font-display text-xl">{planName}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix {isAnnual ? "annuel" : "mensuel"}</span>
            <span>{price.toFixed(2)}€</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-display text-lg">
            <span>Total</span>
            <span>{price.toFixed(2)}€</span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Inclus
          </p>
          <ul className="space-y-1.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="size-3.5 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-surface/50 px-2 py-1 rounded-full">
            <Shield className="size-3" />
            Sécurisé
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-surface/50 px-2 py-1 rounded-full">
            <Clock className="size-3" />
            Sans engagement
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-surface/50 px-2 py-1 rounded-full">
            <Receipt className="size-3" />
            Facture incluse
          </span>
        </div>
      </div>
    </div>
  );
}
