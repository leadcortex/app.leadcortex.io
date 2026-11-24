// frontend/components/payment/payment-desk.tsx

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "@/components/icons";
import { VisaLogo } from "@/components/marketing/pricing-logos";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core/utils";
import { formatEur } from "@/lib/data/pricing-strategy";
import { eur, stampOrder, type Order, type OrderDraft } from "@/lib/payment/order";

type Phase = "idle" | "authorizing";

type Props = {
  draft: OrderDraft;
  disabledReason?: string;
  onPaid: (order: Order) => void;
  className?: string;
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function PaymentDesk({ draft, disabledReason, onPaid, className }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = phase === "authorizing";

  const pay = async () => {
    const stamped = stampOrder(draft);
    setPhase("authorizing");
    await wait(900);
    onPaid(stamped);
  };

  const [euros, cents] = formatEur(draft.total).split(",");
  const unitLabel = draft.cycle === "annual" ? "pour 12 mois" : "par mois";

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("space-y-1 transition-opacity", busy && "opacity-60")}>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Total TTC
        </p>
        <p className="mt-1 flex items-baseline tabular-nums tracking-tighter">
          <span className="text-[56px] font-extrabold leading-none">{euros}</span>
          <span className="text-[26px] font-bold leading-none">,{cents}</span>
          <span className="ml-1 text-[26px] font-bold leading-none">€</span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {unitLabel}
          {draft.cycle === "annual" && (
            <>
              {" "}
              · soit <span className="font-semibold text-foreground">{eur(draft.perMonth)}</span> /
              mois
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          ≈ <span className="font-semibold text-foreground">{eur(draft.perDay)}</span> par jour
        </p>
      </div>

      {disabledReason ? (
        <Button size="lg" className="w-full" disabled>
          {disabledReason}
        </Button>
      ) : (
        <Button
          size="lg"
          className="h-12 w-full text-[15px] font-bold"
          disabled={busy}
          onClick={() => void pay()}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              Autorisation bancaire…
            </>
          ) : (
            <>
              <Lock /> Payer {eur(draft.total)}
            </>
          )}
        </Button>
      )}

      <div className={cn("transition-opacity", busy && "opacity-50")}>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="grid h-7 w-11 shrink-0 place-items-center rounded-md border border-black/10 bg-white p-1 shadow-sm">
            <VisaLogo />
          </span>
          <span className="font-medium text-foreground">Visa •••• 4242</span>
          <button
            type="button"
            className="ml-auto underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => toast.info("Portail de paiement bientôt disponible")}
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
}
