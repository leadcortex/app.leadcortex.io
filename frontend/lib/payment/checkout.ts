// frontend/lib/payment/checkout.ts

import {
  cardBrand,
  cardLength,
  cvcLength,
  digitsOnly,
  einError,
  emailError,
  expiryError,
  ibanError,
  luhn,
  normalizeIban,
  siretError,
  vatNumberError,
} from "@/lib/payment/validation";
import { defaultRegion, isEu, postalCodeError, regionError } from "@/lib/payment/countries";

export type PaymentMethod = "card" | "sepa" | "transfer";

export type CustomerType = "company" | "individual";

export type CheckoutForm = {
  method: PaymentMethod;
  customerType: CustomerType;
  company: string;
  siret: string;
  vatNumber: string;
  fullName: string;
  email: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  region: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  ibanHolder: string;
  iban: string;
  immediateStart: boolean;
};

export type CheckoutErrors = Partial<Record<keyof CheckoutForm, string>>;

export const emptyCheckout = (fullName = "", email = ""): CheckoutForm => ({
  method: "card",
  customerType: "company",
  company: "",
  siret: "",
  vatNumber: "",
  fullName,
  email,
  address1: "",
  address2: "",
  postalCode: "",
  city: "",
  country: "FR",
  region: defaultRegion("FR"),
  cardName: fullName,
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
  ibanHolder: fullName,
  iban: "",
  immediateStart: false,
});

const required = (v: string, label: string, min = 2) =>
  v.trim().length >= min ? null : `${label} requis`;

export function validateDetails(f: CheckoutForm, now = new Date()): CheckoutErrors {
  const e: CheckoutErrors = {};
  const set = (k: keyof CheckoutForm, msg: string | null) => {
    if (msg) e[k] = msg;
  };

  if (f.customerType === "company") {
    set("company", required(f.company, "Raison sociale"));
    if (f.country === "FR") set("siret", siretError(f.siret));
    if (isEu(f.country)) set("vatNumber", vatNumberError(f.vatNumber));
    if (f.country === "US") set("vatNumber", einError(f.vatNumber));
  }
  set("fullName", required(f.fullName, "Nom", 3));
  set("email", emailError(f.email));
  set("address1", required(f.address1, "Adresse", 5));
  set("region", regionError(f.country, f.region));
  set("postalCode", postalCodeError(f.postalCode, f.country, f.region));
  set("city", required(f.city, "Ville"));

  if (f.method === "card") {
    const brand = cardBrand(f.cardNumber);
    const digits = digitsOnly(f.cardNumber);
    set("cardName", required(f.cardName, "Titulaire", 3));
    if (!digits) set("cardNumber", "Numéro requis");
    else if (brand === "unknown") set("cardNumber", "Carte non acceptée");
    else if (digits.length !== cardLength(brand)) set("cardNumber", "Numéro incomplet");
    else if (!luhn(digits)) set("cardNumber", "Numéro invalide");
    set("cardExpiry", expiryError(f.cardExpiry, now));
    if (digitsOnly(f.cardCvc).length !== cvcLength(brand)) set("cardCvc", "Code incomplet");
  }

  if (f.method === "sepa") {
    set("ibanHolder", required(f.ibanHolder, "Titulaire", 3));
    set("iban", ibanError(f.iban));
  }

  return e;
}

export function canConfirm(f: CheckoutForm): boolean {
  return f.customerType === "company" || f.immediateStart;
}

export function paymentLabel(f: CheckoutForm): string {
  if (f.method === "card") {
    const brand = cardBrand(f.cardNumber);
    const name = brand === "amex" ? "AMEX" : brand === "mastercard" ? "MASTERCARD" : "VISA";
    return `${name} •••• ${digitsOnly(f.cardNumber).slice(-4)}`;
  }
  if (f.method === "sepa") return `SEPA •••• ${normalizeIban(f.iban).slice(-4)}`;
  return "VIREMENT BANCAIRE";
}

export const SELLER_BANK = {
  holder: "LeadCortex SAS",
  iban: "FR76 3000 6000 0112 3456 7890 189",
  bic: "AGRIFRPPXXX",
  creditorId: "FR12ZZZ123456",
  isPlaceholder: true,
};

export const TRANSFER_STEPS = [
  { id: "received", label: "Virement reçu" },
  { id: "amount", label: "Montant contrôlé" },
  { id: "reference", label: "Référence rapprochée" },
  { id: "validated", label: "Paiement validé" },
] as const;
