// frontend/components/payment/checkout/order-summary.tsx

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Lock, Repeat, RotateCcw } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ConsentCheck } from "@/components/payment/checkout/fields";
import type { Bind } from "@/components/payment/checkout/payment-method-fields";
import { cn } from "@/lib/core/utils";
import { SELLER_BANK, canConfirm, paymentLabel, type PaymentMethod } from "@/lib/payment/checkout";
import { eur, type OrderDraft } from "@/lib/payment/order";
import { FR_METRO, countryLabel, regionLabel } from "@/lib/payment/countries";

export const PAYMENT_TERMS_HREF = "/legal/paiement";

export type PayPhase = "idle" | "processing";

const PROCESSING_LABEL: Record<PaymentMethod, string> = {
  card: "Validation par votre banque…",
  sepa: "Enregistrement du mandat…",
  transfer: "Recherche du virement…",
};

function payLabel(method: PaymentMethod, total: number) {
  return method === "transfer" ? "J'ai effectué le virement" : `Payer ${eur(total)}`;
}

function TermsLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="underline underline-offset-2">
      {children}
    </a>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="truncate text-[14px] font-medium">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-[13px] font-medium text-primary hover:underline"
        >
          Modifier
        </button>
      )}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(label === "IBAN" ? value.replace(/\s/g, "") : value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible");
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-[13px] font-medium">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`Copier ${label}`}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
          copied ? "text-success" : "text-muted-foreground hover:bg-surface hover:text-foreground",
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export function ConfirmStep({
  draft,
  planLabel,
  bind,
  phase,
  transferReference,
  onEditPlan,
  onEditDetails,
}: {
  draft: OrderDraft;
  planLabel: string;
  bind: Bind;
  phase: PayPhase;
  transferReference: string;
  onEditPlan: () => void;
  onEditDetails: () => void;
}) {
  const { form, set } = bind;
  const busy = phase === "processing";
  const region =
    form.region && form.region !== FR_METRO ? regionLabel(form.country, form.region) : "";
  const country = [region, countryLabel(form.country)].filter(Boolean).join(", ");
  const canPay = canConfirm(form);
  const discounts = draft.lines.filter((l) => l.kind === "discount");
  const every = draft.cycle === "annual" ? "chaque année" : "chaque mois";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-[13px] text-muted-foreground">{planLabel}</p>
        <p className="mt-1 text-[44px] font-extrabold leading-none tracking-tight tabular-nums">
          {eur(draft.total)}
        </p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {draft.cycle === "annual" ? "par an" : "par mois"} · TTC
          {discounts.length > 0 && (
            <span className="ml-1.5 text-success">
              {discounts.map((d) => d.label.toLowerCase()).join(", ")} incluse
            </span>
          )}
        </p>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border px-4">
        <Row label="Forfait" value={planLabel} onEdit={onEditPlan} />
        {form.method !== "transfer" && (
          <Row label="Paiement" value={paymentLabel(form)} onEdit={onEditDetails} />
        )}
        <Row
          label="Facturation"
          value={[form.company || form.fullName, `${form.postalCode} ${form.city}`.trim(), country]
            .filter(Boolean)
            .join(" · ")}
          onEdit={onEditDetails}
        />
      </div>

      {form.method === "transfer" && (
        <div className="divide-y divide-border rounded-2xl bg-surface/60 px-4">
          <CopyRow label="IBAN" value={SELLER_BANK.iban} />
          <CopyRow label="BIC" value={SELLER_BANK.bic} />
          <CopyRow label="Référence" value={transferReference} />
        </div>
      )}

      <ul className="space-y-2 px-1 text-[13px] text-muted-foreground">
        <li className="flex items-center gap-2.5">
          <Repeat className="size-4 shrink-0" />
          {form.method === "transfer"
            ? `Facture envoyée ${every}, à régler par virement`
            : `Prélevé automatiquement ${every}`}
        </li>
        <li className="flex items-center gap-2.5">
          <RotateCcw className="size-4 shrink-0" />
          Résiliable à tout moment
        </li>
      </ul>

      {form.customerType === "individual" && (
        <ConsentCheck checked={form.immediateStart} onChange={(v) => set("immediateStart", v)}>
          Je souhaite accéder au service immédiatement.
        </ConsentCheck>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          disabled={busy || !canPay}
          className="h-12 w-full text-[15px] font-semibold"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              {PROCESSING_LABEL[form.method]}
            </>
          ) : (
            <>
              <Lock />
              {payLabel(form.method, draft.total)}
            </>
          )}
        </Button>
        <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
          En confirmant, vous acceptez les <TermsLink href="/legal/cgv">CGV</TermsLink> et les{" "}
          <TermsLink href={PAYMENT_TERMS_HREF}>conditions de paiement</TermsLink>
          {form.method === "sepa" ? " et autorisez le prélèvement SEPA." : "."}
        </p>
      </div>
    </div>
  );
}
