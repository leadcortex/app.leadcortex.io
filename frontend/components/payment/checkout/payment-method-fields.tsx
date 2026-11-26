// frontend/components/payment/checkout/payment-method-fields.tsx

import { Building, CreditCard, Repeat } from "@/components/icons";
import { MastercardLogo, VisaLogo } from "@/components/marketing/pricing-logos";
import { Segmented, TextField } from "@/components/payment/checkout/fields";
import type { CheckoutErrors, CheckoutForm, PaymentMethod } from "@/lib/payment/checkout";
import {
  cardBrand,
  cvcLength,
  formatCardNumber,
  formatExpiry,
  formatIban,
  type CardBrand,
} from "@/lib/payment/validation";

export type Bind = {
  form: CheckoutForm;
  errors: CheckoutErrors;
  set: <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => void;
  touch: (key: keyof CheckoutForm) => void;
};

const METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "card", label: "Carte", icon: <CreditCard className="size-4" /> },
  { value: "sepa", label: "Prélèvement", icon: <Repeat className="size-4" /> },
  { value: "transfer", label: "Virement", icon: <Building className="size-4" /> },
];

export function BrandChip({ brand }: { brand: CardBrand }) {
  if (brand === "unknown") return <CreditCard className="size-5 text-muted-foreground/50" />;
  return (
    <span className="grid h-6 w-10 place-items-center rounded-md border border-black/10 bg-white p-0.5 shadow-sm">
      {brand === "visa" && <VisaLogo />}
      {brand === "mastercard" && <MastercardLogo />}
      {brand === "amex" && (
        <span className="text-[8px] font-black tracking-tight text-[#2E77BC]">AMEX</span>
      )}
    </span>
  );
}

function CardFields({ form, errors, set, touch }: Bind) {
  const brand = cardBrand(form.cardNumber);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <TextField
        className="col-span-2"
        label="Numéro de carte"
        value={form.cardNumber}
        onChange={(v) => set("cardNumber", formatCardNumber(v))}
        onBlur={() => touch("cardNumber")}
        error={errors.cardNumber}
        autoComplete="cc-number"
        inputMode="numeric"
        inputClassName="font-mono tracking-wide"
        adornment={<BrandChip brand={brand} />}
      />
      <TextField
        label="MM / AA"
        value={form.cardExpiry}
        onChange={(v) => set("cardExpiry", formatExpiry(v))}
        onBlur={() => touch("cardExpiry")}
        error={errors.cardExpiry}
        autoComplete="cc-exp"
        inputMode="numeric"
        maxLength={5}
        inputClassName="font-mono"
      />
      <TextField
        label="CVC"
        value={form.cardCvc}
        onChange={(v) => set("cardCvc", v.replace(/\D/g, "").slice(0, cvcLength(brand)))}
        onBlur={() => touch("cardCvc")}
        error={errors.cardCvc}
        autoComplete="cc-csc"
        inputMode="numeric"
        type="password"
        inputClassName="font-mono"
      />
      <TextField
        className="col-span-2"
        label="Titulaire de la carte"
        value={form.cardName}
        onChange={(v) => set("cardName", v)}
        onBlur={() => touch("cardName")}
        error={errors.cardName}
        autoComplete="cc-name"
      />
    </div>
  );
}

function SepaFields({ form, errors, set, touch }: Bind) {
  return (
    <div className="space-y-2.5">
      <TextField
        label="IBAN"
        value={form.iban}
        onChange={(v) => set("iban", formatIban(v))}
        onBlur={() => touch("iban")}
        error={errors.iban}
        autoComplete="off"
        inputClassName="font-mono uppercase tracking-wide"
      />
      <TextField
        label="Titulaire du compte"
        value={form.ibanHolder}
        onChange={(v) => set("ibanHolder", v)}
        onBlur={() => touch("ibanHolder")}
        error={errors.ibanHolder}
        autoComplete="name"
      />
    </div>
  );
}

export function PaymentMethodFields({ bind }: { bind: Bind }) {
  const { form, set } = bind;
  return (
    <div className="space-y-3">
      <Segmented
        label="Moyen de paiement"
        value={form.method}
        onChange={(m) => set("method", m)}
        options={METHODS}
      />
      <div key={form.method} className="animate-in fade-in duration-200">
        {form.method === "card" && <CardFields {...bind} />}
        {form.method === "sepa" && <SepaFields {...bind} />}
        {form.method === "transfer" && (
          <p className="rounded-xl bg-surface/60 px-4 py-3.5 text-[13px] text-muted-foreground">
            Les coordonnées bancaires s'affichent à l'étape suivante.
          </p>
        )}
      </div>
    </div>
  );
}
