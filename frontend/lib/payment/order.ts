// frontend/lib/payment/order.ts

import { formatEur, loyaltyDiscount, type Plan } from "@/lib/data/pricing-strategy";

export type Cycle = "monthly" | "annual";

export type OrderLine = {
  id: string;
  label: string;
  detail?: string;
  amount: number;
  kind: "item" | "discount";
};

export type OrderDraft = {
  title: string;
  cycle: Cycle;
  lines: OrderLine[];
  total: number;
  vat: number;
  vatRate: number;
  perDay: number;
  perMonth: number;
  nextChargeLabel: string;
  key: string;
};

export type Order = OrderDraft & {
  id: string;
  issuedAt: Date;
};

export const LOYALTY_MONTHS_SIM = 6;

export const BILLING_ANCHOR_DAY = 12;

export const VAT_RATE = 0.2;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const eur = (n: number) => `${formatEur(n)}\u00A0€`;

export function vatIncluded(totalTtc: number, rate = VAT_RATE): number {
  return round2(totalTtc - totalTtc / (1 + rate));
}

const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export function formatDateFr(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTimeFr(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function nextCharge(from: Date, cycle: Cycle, anchorDay = BILLING_ANCHOR_DAY): Date {
  const next = new Date(from.getFullYear(), from.getMonth(), anchorDay);
  if (cycle === "annual") {
    next.setFullYear(from.getFullYear() + 1);
    return next;
  }
  if (next.getTime() <= from.getTime()) next.setMonth(next.getMonth() + 1);
  return next;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeOrderNumber(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const n = String(1000 + Math.floor(Math.random() * 9000));
  return `LC-${y}${m}-${n}`;
}

export function authCode(orderId: string): string {
  return String(100000 + (hash(orderId) % 900000));
}

export function stampOrder(draft: OrderDraft): Order {
  const issuedAt = new Date();
  return { ...draft, id: makeOrderNumber(issuedAt), issuedAt };
}

function finalize(args: {
  title: string;
  cycle: Cycle;
  lines: OrderLine[];
  total: number;
}): OrderDraft {
  const { title, cycle, lines } = args;
  const total = round2(args.total);
  const days = cycle === "annual" ? 365 : 30;
  const perMonth = cycle === "annual" ? round2(total / 12) : total;
  const key = `${title}|${cycle}|${lines.map((l) => `${l.id}:${l.amount}`).join(",")}`;
  return {
    title,
    cycle,
    lines,
    total,
    vat: vatIncluded(total),
    vatRate: VAT_RATE,
    perDay: round2(total / days),
    perMonth,
    nextChargeLabel: formatDateFr(nextCharge(new Date(), cycle)),
    key,
  };
}

export function buildPlanOrder(
  plan: Plan,
  cycle: Cycle,
  loyaltyMonths = LOYALTY_MONTHS_SIM,
): OrderDraft {
  const lines: OrderLine[] = [];
  const discount = loyaltyDiscount(loyaltyMonths);

  let afterCycle: number;
  if (cycle === "annual") {
    const gross = round2(plan.monthlyPrice * 12);
    afterCycle = plan.annualPrice;
    lines.push({
      id: "plan",
      label: `Forfait ${plan.name}`,
      detail: "12 mois",
      amount: gross,
      kind: "item",
    });
    lines.push({
      id: "annual",
      label: "Remise annuelle",
      detail: plan.annualDiscountLabel.replace("-", "−"),
      amount: -round2(gross - afterCycle),
      kind: "discount",
    });
  } else {
    afterCycle = plan.monthlyPrice;
    lines.push({
      id: "plan",
      label: `Forfait ${plan.name}`,
      detail: "1 mois",
      amount: plan.monthlyPrice,
      kind: "item",
    });
  }

  const total = round2(afterCycle * (1 - discount));
  const loyalty = round2(afterCycle - total);
  if (loyalty > 0) {
    lines.push({
      id: "loyalty",
      label: "Fidélité",
      detail: `${loyaltyMonths} mois · −${Math.round(discount * 100)} %`,
      amount: -loyalty,
      kind: "discount",
    });
  }

  return finalize({ title: `Forfait ${plan.name}`, cycle, lines, total });
}

export function buildCustomOrder(args: {
  items: { id: string; label: string; detail?: string; amount: number }[];
  cycle: Cycle;
  annualDiscount: number;
  loyaltyMonths?: number;
}): OrderDraft {
  const { items, cycle, annualDiscount, loyaltyMonths = LOYALTY_MONTHS_SIM } = args;
  const discount = loyaltyDiscount(loyaltyMonths);
  const monthly = round2(items.reduce((s, i) => s + i.amount, 0));
  const lines: OrderLine[] = [];

  const mult = cycle === "annual" ? 12 : 1;
  for (const it of items) {
    lines.push({
      id: it.id,
      label: it.label,
      detail: it.detail,
      amount: round2(it.amount * mult),
      kind: "item",
    });
  }

  let afterCycle = round2(monthly * mult);
  if (cycle === "annual") {
    const cut = round2(afterCycle * annualDiscount);
    afterCycle = round2(afterCycle - cut);
    lines.push({
      id: "annual",
      label: "Remise annuelle",
      detail: `−${Math.round(annualDiscount * 100)} %`,
      amount: -cut,
      kind: "discount",
    });
  }

  const total = round2(afterCycle * (1 - discount));
  const loyalty = round2(afterCycle - total);
  if (loyalty > 0) {
    lines.push({
      id: "loyalty",
      label: "Fidélité",
      detail: `${loyaltyMonths} mois · −${Math.round(discount * 100)} %`,
      amount: -loyalty,
      kind: "discount",
    });
  }

  return finalize({ title: "Forfait sur mesure", cycle, lines, total });
}
