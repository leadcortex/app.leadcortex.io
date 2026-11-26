// frontend/lib/payment/validation.ts

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

export function cardBrand(number: string): CardBrand {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return "unknown";
}

export function cardLength(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

export function formatCardNumber(input: string): string {
  const d = digitsOnly(input);
  const brand = cardBrand(d);
  const max = cardLength(brand);
  const clipped = d.slice(0, max);
  if (brand === "amex") {
    return [clipped.slice(0, 4), clipped.slice(4, 10), clipped.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return clipped.replace(/(.{4})/g, "$1 ").trim();
}

export function luhn(number: string): boolean {
  const d = digitsOnly(number);
  if (d.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function formatExpiry(input: string): string {
  let d = digitsOnly(input).slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function expiryError(value: string, now = new Date()): string | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!m) return "Format MM/AA";
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Mois invalide";
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  if (year < thisYear || (year === thisYear && month < thisMonth)) return "Carte expirée";
  if (year > thisYear + 20) return "Date trop lointaine";
  return null;
}

export const IBAN_LENGTHS: Record<string, number> = {
  FR: 27,
  BE: 16,
  LU: 20,
  CH: 21,
  MC: 27,
  DE: 22,
  ES: 24,
  IT: 27,
  NL: 18,
  PT: 25,
  AT: 20,
  IE: 22,
};

export const normalizeIban = (s: string) => s.replace(/\s+/g, "").toUpperCase();

export function formatIban(input: string): string {
  return normalizeIban(input)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 34)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function ibanError(value: string): string | null {
  const iban = normalizeIban(value);
  if (!iban) return "IBAN requis";
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return "Format IBAN invalide";
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (!expected) return "Pays non couvert par le prélèvement SEPA";
  if (iban.length !== expected) return `Un IBAN ${iban.slice(0, 2)} compte ${expected} caractères`;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const v = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const digit of v) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1 ? null : "IBAN invalide (clé de contrôle)";
}

export function bicError(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (!v) return null;
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v)
    ? null
    : "BIC invalide (8 ou 11 caractères)";
}

export function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return "E-mail requis";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "E-mail invalide";
}

export function vatNumberError(value: string): string | null {
  const v = value.replace(/\s+/g, "").toUpperCase();
  if (!v) return null;
  if (v.startsWith("FR")) {
    const m = /^FR([0-9A-Z]{2})(\d{9})$/.exec(v);
    if (!m) return "Format : FR + 2 caractères + SIREN (9 chiffres)";
    if (/^\d{2}$/.test(m[1])) {
      const siren = Number(m[2]);
      const key = (12 + 3 * (siren % 97)) % 97;
      if (key !== Number(m[1])) return "Clé de TVA incorrecte";
    }
    return null;
  }
  return /^[A-Z]{2}[0-9A-Z]{2,12}$/.test(v) ? null : "Numéro de TVA invalide";
}

export function siretError(value: string): string | null {
  const v = digitsOnly(value);
  if (!value.trim()) return null;
  if (v.length !== 14) return "Un SIRET compte 14 chiffres";
  return luhn(v) ? null : "SIRET invalide";
}

export function einError(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  return /^\d{2}-?\d{7}$/.test(v) ? null : "Format EIN : 12-3456789";
}
