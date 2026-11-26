// frontend/lib/__tests__/payment-validation.test.ts

import { describe, expect, it } from "vitest";
import { canConfirm, emptyCheckout, validateDetails } from "@/lib/payment/checkout";
import { COUNTRIES, postalCodeError, regionError } from "@/lib/payment/countries";
import {
  cardBrand,
  expiryError,
  formatCardNumber,
  formatExpiry,
  ibanError,
  luhn,
  siretError,
  vatNumberError,
} from "@/lib/payment/validation";

const NOW = new Date(2026, 10, 25);

describe("carte", () => {
  it("détecte la marque", () => {
    expect(cardBrand("4242")).toBe("visa");
    expect(cardBrand("5555")).toBe("mastercard");
    expect(cardBrand("2221")).toBe("mastercard");
    expect(cardBrand("3782")).toBe("amex");
    expect(cardBrand("6011")).toBe("unknown");
  });

  it("formate selon la marque", () => {
    expect(formatCardNumber("4242424242424242999")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
  });

  it("vérifie la clé de Luhn", () => {
    expect(luhn("4242 4242 4242 4242")).toBe(true);
    expect(luhn("4242 4242 4242 4241")).toBe(false);
  });

  it("contrôle la date d'expiration", () => {
    expect(formatExpiry("3")).toBe("03");
    expect(formatExpiry("1228")).toBe("12/28");
    expect(expiryError("11/26", NOW)).toBeNull();
    expect(expiryError("10/26", NOW)).toBe("Carte expirée");
    expect(expiryError("13/27", NOW)).toBe("Mois invalide");
  });
});

describe("IBAN", () => {
  it("accepte un IBAN valide, avec ou sans espaces", () => {
    expect(ibanError("FR76 3000 6000 0112 3456 7890 189")).toBeNull();
    expect(ibanError("be68539007547034")).toBeNull();
  });

  it("refuse une mauvaise clé ou longueur", () => {
    expect(ibanError("FR76 3000 6000 0112 3456 7890 188")).toMatch(/clé/);
    expect(ibanError("FR76 3000")).toMatch(/27/);
  });
});

describe("adresse et entreprise", () => {
  it("valide les codes postaux par pays", () => {
    expect(postalCodeError("75011", "FR")).toBeNull();
    expect(postalCodeError("00100", "FR")).not.toBeNull();
    expect(postalCodeError("1000", "BE")).toBeNull();
    expect(postalCodeError("H2X 1Y4", "CA")).toBeNull();
  });

  it("valide SIRET et TVA intracommunautaire", () => {
    expect(siretError("732 829 320 00074")).toBeNull();
    expect(siretError("732 829 320 00075")).toBe("SIRET invalide");
    expect(vatNumberError("FR44732829320")).toBeNull();
    expect(vatNumberError("FR45732829320")).toBe("Clé de TVA incorrecte");
  });
});

describe("validateDetails", () => {
  const base = {
    ...emptyCheckout("Jeanne Martin", "jeanne@exemple.fr"),
    company: "Acme",
    address1: "12 rue de la Paix",
    postalCode: "75002",
    city: "Paris",
  };

  it("carte complète : aucune erreur", () => {
    const f = { ...base, cardNumber: "4242 4242 4242 4242", cardExpiry: "12/28", cardCvc: "123" };
    expect(validateDetails(f, NOW)).toEqual({});
  });

  it("SEPA : seul l'IBAN et le titulaire sont demandés", () => {
    const f = { ...base, method: "sepa" as const, iban: "FR7630006000011234567890189" };
    expect(validateDetails(f, NOW)).toEqual({});
  });

  it("virement : aucun champ bancaire ; un particulier doit demander l'accès immédiat", () => {
    const f = { ...base, method: "transfer" as const, customerType: "individual" as const };
    expect(validateDetails(f, NOW)).toEqual({});
    expect(canConfirm(f)).toBe(false);
    expect(canConfirm({ ...f, immediateStart: true })).toBe(true);
  });
});

describe("pays et territoires", () => {
  it("liste presque tous les pays, en français, sans doublon des DOM-TOM", () => {
    expect(COUNTRIES.length).toBeGreaterThan(220);
    expect(COUNTRIES.find((c) => c.code === "US")?.label).toBe("États-Unis");
    expect(COUNTRIES.some((c) => c.code === "GP")).toBe(false);
  });

  it("valide le code postal selon le territoire français", () => {
    expect(postalCodeError("75011", "FR", "METRO")).toBeNull();
    expect(postalCodeError("97200", "FR", "METRO")).not.toBeNull();
    expect(postalCodeError("97200", "FR", "MQ")).toBeNull();
    expect(postalCodeError("98800", "FR", "NC")).toBeNull();
  });

  it("gère les ZIP américains et l'État obligatoire", () => {
    expect(postalCodeError("94103", "US", "CA")).toBeNull();
    expect(postalCodeError("94103-1234", "US", "CA")).toBeNull();
    expect(postalCodeError("9410", "US", "CA")).not.toBeNull();
    expect(regionError("US", "")).toBe("État requis");
    expect(regionError("US", "NY")).toBeNull();
    expect(regionError("DE", "")).toBeNull();
  });

  it("n'exige pas de code postal là où il n'en existe pas", () => {
    expect(postalCodeError("", "AE")).toBeNull();
    expect(postalCodeError("", "DE")).not.toBeNull();
  });

  it("une entreprise américaine passe sans TVA ni SIRET", () => {
    const f = {
      ...emptyCheckout("John Doe", "john@acme.com"),
      company: "Acme Inc.",
      country: "US",
      region: "NY",
      address1: "350 Fifth Avenue",
      postalCode: "10118",
      city: "New York",
      vatNumber: "12-3456789",
      cardNumber: "4242 4242 4242 4242",
      cardExpiry: "12/28",
      cardCvc: "123",
    };
    expect(validateDetails(f, NOW)).toEqual({});
  });
});
