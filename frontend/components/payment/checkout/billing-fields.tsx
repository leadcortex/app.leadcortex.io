// frontend/components/payment/checkout/billing-fields.tsx

import { useState } from "react";
import { RevealLink, Segmented, TextField } from "@/components/payment/checkout/fields";
import type { Bind } from "@/components/payment/checkout/payment-method-fields";
import { SearchSelect } from "@/components/payment/checkout/search-select";
import { cn } from "@/lib/core/utils";
import type { CheckoutForm, CustomerType } from "@/lib/payment/checkout";
import {
  COUNTRIES,
  FEATURED_COUNTRIES,
  defaultRegion,
  hasPostalCode,
  isEu,
  postalLabel,
  regionSet,
} from "@/lib/payment/countries";

const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
  { value: "company", label: "Entreprise" },
  { value: "individual", label: "Particulier" },
];

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.label, badge: c.code }));

type TextKey = {
  [K in keyof CheckoutForm]: CheckoutForm[K] extends string ? K : never;
}[keyof CheckoutForm];

function taxLabel(country: string) {
  if (country === "FR") return "N° de TVA ou SIRET";
  if (isEu(country)) return "N° de TVA";
  if (country === "US") return "EIN";
  return "N° d'identification fiscale";
}

export function BillingFields({ form, errors, set, touch }: Bind) {
  const [showTax, setShowTax] = useState(Boolean(form.siret || form.vatNumber));
  const [showLine2, setShowLine2] = useState(Boolean(form.address2));
  const text = (key: TextKey) => ({
    value: form[key],
    onChange: (v: string) => set(key, v),
    onBlur: () => touch(key),
    error: errors[key],
  });
  const isCompany = form.customerType === "company";
  const regions = regionSet(form.country);
  const postal = hasPostalCode(form.country);
  const usStyle = form.country === "US" || form.country === "CA" || form.country === "AU";

  const changeCountry = (code: string) => {
    set("country", code);
    set("region", defaultRegion(code));
    if (code !== "FR") set("siret", "");
  };

  const regionField = regions && (
    <SearchSelect
      label={regions.label}
      value={form.region}
      options={regions.regions.map((r) => ({ value: r.code, label: r.label }))}
      onChange={(v) => set("region", v)}
      onBlur={() => touch("region")}
      error={errors.region}
    />
  );
  const postalField = postal && (
    <TextField
      label={postalLabel(form.country)}
      autoComplete="postal-code"
      inputMode={/^(US|FR|DE|ES|IT|MX|IN|AU)$/.test(form.country) ? "numeric" : "text"}
      inputClassName="uppercase"
      {...text("postalCode")}
    />
  );
  const cityField = <TextField label="Ville" autoComplete="address-level2" {...text("city")} />;

  return (
    <div className="space-y-2.5">
      <Segmented
        label="Type de client"
        value={form.customerType}
        onChange={(v) => set("customerType", v)}
        options={CUSTOMER_TYPES}
      />

      <SearchSelect
        label="Pays"
        value={form.country}
        options={COUNTRY_OPTIONS}
        featured={FEATURED_COUNTRIES}
        onChange={changeCountry}
        searchPlaceholder="Rechercher un pays"
      />

      {isCompany && (
        <TextField label="Raison sociale" autoComplete="organization" {...text("company")} />
      )}
      {isCompany && showTax && (
        <div className={cn("grid grid-cols-1 gap-2.5", form.country === "FR" && "@sm:grid-cols-2")}>
          <TextField
            label={`${form.country === "FR" ? "N° de TVA" : taxLabel(form.country)} (facultatif)`}
            inputClassName="font-mono uppercase"
            {...text("vatNumber")}
          />
          {form.country === "FR" && (
            <TextField
              label="SIRET (facultatif)"
              inputMode="numeric"
              inputClassName="font-mono"
              {...text("siret")}
            />
          )}
        </div>
      )}
      {isCompany && !showTax && (
        <RevealLink label={taxLabel(form.country)} onClick={() => setShowTax(true)} />
      )}

      <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-2">
        <TextField label="Nom complet" autoComplete="name" {...text("fullName")} />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          {...text("email")}
        />
      </div>

      <TextField label="Adresse" autoComplete="address-line1" {...text("address1")} />
      {showLine2 ? (
        <TextField
          label="Bâtiment, étage, appartement"
          autoComplete="address-line2"
          {...text("address2")}
        />
      ) : (
        <RevealLink label="Complément d'adresse" onClick={() => setShowLine2(true)} />
      )}

      {usStyle ? (
        <div className="grid grid-cols-2 gap-2.5 @sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="col-span-2 @sm:col-span-1">{cityField}</div>
          {regionField}
          {postalField}
        </div>
      ) : (
        <>
          <div
            className={cn(
              "grid gap-2.5",
              postal ? "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "grid-cols-1",
            )}
          >
            {postalField}
            {cityField}
          </div>
          {regionField}
        </>
      )}
    </div>
  );
}
