// frontend/lib/__tests__/invoice-pdf.test.ts

import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/data/pricing-strategy";
import { emptyCheckout } from "@/lib/payment/checkout";
import { buildInvoicePdf, customerBlock, invoiceLines } from "@/lib/payment/invoice-pdf";
import { buildPlanOrder, stampOrder } from "@/lib/payment/order";

const order = stampOrder(buildPlanOrder(getPlan("founder"), "annual", 0));
const form = {
  ...emptyCheckout("John Doe", "john@acme.com"),
  company: "Acme Inc.",
  country: "US",
  region: "NY",
  address1: "350 Fifth Avenue",
  address2: "Suite 3300",
  postalCode: "10118",
  city: "New York",
  vatNumber: "12-3456789",
};

describe("facture PDF", () => {
  it("les montants HT + TVA retombent exactement sur le TTC", () => {
    const t = invoiceLines(order);
    const sum = t.lines.reduce((s, l) => s + l.ht, 0);
    expect(Math.round(sum * 100) / 100).toBe(t.totalHt);
    expect(Math.round((t.totalHt + t.vat) * 100) / 100).toBe(t.totalTtc);
  });

  it("formate l'adresse à l'américaine", () => {
    expect(customerBlock(form)).toContain("New York, NY 10118");
    expect(customerBlock(form)).toContain("États-Unis");
  });

  it("produit un vrai PDF", async () => {
    const bytes = await buildInvoicePdf({ order, form, paymentLabel: "VISA •••• 4242" });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    if (process.env.INVOICE_OUT) writeFileSync(process.env.INVOICE_OUT, bytes);
  });
});
