// frontend/lib/payment/invoice-pdf.ts

import { LEGAL } from "@/lib/core/legal-config";
import { FR_METRO, countryLabel, regionLabel } from "@/lib/payment/countries";
import type { CheckoutForm } from "@/lib/payment/checkout";
import { authCode, formatDateFr, nextCharge, round2, type Order } from "@/lib/payment/order";

export type InvoiceInput = {
  order: Order;
  form: CheckoutForm;
  paymentLabel: string;
};

const ch = (...codes: number[]) => String.fromCharCode(...codes);
const SPACES = new RegExp(`[${ch(0x202f, 0xa0)}]`, "g");
const DASHES = new RegExp(`[${ch(0x2212, 0x2013, 0x2014)}]`, "g");
const QUOTES = new RegExp(`[${ch(0x2018, 0x2019)}]`, "g");
const BULLET = new RegExp(ch(0x2022), "g");
const NON_WINANSI = new RegExp(
  `[^${ch(0x20)}-${ch(0x7e)}${ch(0xa0)}-${ch(0xff)}${ch(0x20ac)}]`,
  "g",
);

const pdfSafe = (s: string) =>
  s
    .replace(SPACES, " ")
    .replace(DASHES, "-")
    .replace(QUOTES, "'")
    .replace(BULLET, "*")
    .replace(NON_WINANSI, "");
const money = (n: number) =>
  pdfSafe(
    `${n < 0 ? "-" : ""}${Math.abs(n).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`,
  );

export function invoiceLines(order: Order) {
  const rate = order.vatRate;
  const lines = order.lines.map((l) => ({
    label: l.detail ? `${l.label} (${l.detail})` : l.label,
    ht: round2(l.amount / (1 + rate)),
  }));
  const totalHt = round2(order.total - order.vat);
  const drift = round2(totalHt - lines.reduce((s, l) => s + l.ht, 0));
  if (lines.length && drift !== 0)
    lines[lines.length - 1].ht = round2(lines[lines.length - 1].ht + drift);
  return { lines, totalHt, vat: order.vat, totalTtc: order.total };
}

export function customerBlock(form: CheckoutForm): string[] {
  const usStyle = form.country === "US" || form.country === "CA" || form.country === "AU";
  const region =
    !usStyle && form.region && form.region !== FR_METRO
      ? regionLabel(form.country, form.region)
      : "";
  const cityLine = usStyle
    ? `${form.city}, ${form.region} ${form.postalCode}`
    : `${form.postalCode} ${form.city}`;
  return [
    form.customerType === "company" ? form.company : form.fullName,
    form.customerType === "company" ? `À l'attention de ${form.fullName}` : "",
    form.address1,
    form.address2,
    cityLine.trim(),
    [region, countryLabel(form.country)].filter(Boolean).join(", "),
    form.vatNumber ? `N° fiscal : ${form.vatNumber.toUpperCase()}` : "",
    form.siret ? `SIRET : ${form.siret}` : "",
    form.email,
  ].filter((l) => l.trim().length > 0);
}

export async function buildInvoicePdf({ order, form, paymentLabel }: InvoiceInput) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`Facture ${order.id}`);
  doc.setAuthor(LEGAL.brand);
  doc.setCreationDate(order.issuedAt);

  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.12, 0.14);
  const muted = rgb(0.42, 0.42, 0.46);
  const rule = rgb(0.86, 0.86, 0.88);
  const left = 50;
  const right = 545;

  const text = (
    s: string,
    x: number,
    y: number,
    opts: {
      size?: number;
      font?: typeof regular;
      color?: typeof ink;
      align?: "left" | "right";
    } = {},
  ) => {
    const { size = 9.5, font = regular, color = ink, align = "left" } = opts;
    const safe = pdfSafe(s);
    const w = font.widthOfTextAtSize(safe, size);
    page.drawText(safe, { x: align === "right" ? x - w : x, y, size, font, color });
  };
  const hr = (y: number) =>
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.6, color: rule });

  const wrap = (s: string, size: number, width: number) => {
    const words = pdfSafe(s).split(" ");
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (regular.widthOfTextAtSize(next, size) > width && line) {
        out.push(line);
        line = w;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };

  const { entity } = LEGAL;
  let y = 790;
  text(LEGAL.brand.toUpperCase(), left, y, { size: 16, font: bold });
  text("FACTURE", right, y, { size: 16, font: bold, align: "right" });
  y -= 18;
  const seller = [
    `${entity.name} · ${entity.form} au capital de ${entity.capital}`,
    entity.address,
    `SIREN ${entity.siren} · ${entity.registry}`,
    `TVA intracommunautaire ${entity.vatNumber}`,
    LEGAL.contacts.general,
  ];
  for (const l of seller) {
    text(l, left, y, { size: 8.5, color: muted });
    y -= 12;
  }

  const periodEnd = nextCharge(order.issuedAt, order.cycle);
  periodEnd.setDate(periodEnd.getDate() - 1);
  const meta: [string, string][] = [
    ["N°", order.id],
    ["Date d'émission", formatDateFr(order.issuedAt)],
    ["Période", `${formatDateFr(order.issuedAt)} au ${formatDateFr(periodEnd)}`],
    ["Opération", "Prestation de services"],
  ];
  let my = 772;
  for (const [k, v] of meta) {
    text(k, 375, my, { size: 8.5, color: muted, align: "right" });
    text(v, right, my, { size: 8.5, align: "right" });
    my -= 12;
  }

  y = Math.min(y, my) - 18;
  text("FACTURÉ À", left, y, { size: 8, font: bold, color: muted });
  y -= 14;
  for (const l of customerBlock(form)) {
    text(l, left, y, { size: 9.5 });
    y -= 13;
  }

  y -= 16;
  text("Désignation", left, y, { size: 8, font: bold, color: muted });
  text("Qté", 380, y, { size: 8, font: bold, color: muted, align: "right" });
  text("Montant HT", right, y, { size: 8, font: bold, color: muted, align: "right" });
  y -= 8;
  hr(y);
  y -= 16;

  const totals = invoiceLines(order);
  for (const l of totals.lines) {
    text(l.label, left, y);
    text("1", 380, y, { align: "right" });
    text(money(l.ht), right, y, { align: "right" });
    y -= 18;
  }
  hr(y + 6);
  y -= 10;

  const totalRow = (k: string, v: string, strong = false) => {
    text(k, 440, y, { size: strong ? 11 : 9.5, font: strong ? bold : regular, align: "right" });
    text(v, right, y, { size: strong ? 11 : 9.5, font: strong ? bold : regular, align: "right" });
    y -= strong ? 20 : 15;
  };
  totalRow("Total HT", money(totals.totalHt));
  totalRow(`TVA ${Math.round(order.vatRate * 100)} %`, money(totals.vat));
  totalRow("Total TTC", money(totals.totalTtc), true);

  y -= 6;
  page.drawRectangle({
    x: left,
    y: y - 30,
    width: right - left,
    height: 42,
    color: rgb(0.96, 0.97, 0.96),
  });
  text(`Payée le ${formatDateFr(order.issuedAt)}`, left + 12, y - 2, { size: 10, font: bold });
  text(`${paymentLabel} · autorisation ${authCode(order.id)}`, left + 12, y - 18, {
    size: 8.5,
    color: muted,
  });
  text("Net à payer : 0,00 €", right - 12, y - 2, { size: 10, font: bold, align: "right" });
  y -= 56;

  const legal = [
    `Abonnement ${order.cycle === "annual" ? "annuel" : "mensuel"} renouvelé automatiquement. Prochaine échéance : ${order.nextChargeLabel}. Résiliable à tout moment ; la période payée reste acquise.`,
    "Pas d'escompte pour paiement anticipé.",
    "Clients professionnels : en cas de retard, pénalités au taux BCE majoré de 10 points et indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 et D441-5 du Code de commerce).",
    `Conditions de paiement : https://${LEGAL.domain}/legal/paiement`,
  ];
  for (const para of legal) {
    for (const l of wrap(para, 7.5, right - left)) {
      text(l, left, y, { size: 7.5, color: muted });
      y -= 10;
    }
    y -= 3;
  }

  text(`${LEGAL.brand} · ${LEGAL.domain}`, left, 40, { size: 7.5, color: muted });
  text("Page 1/1", right, 40, { size: 7.5, color: muted, align: "right" });

  return doc.save();
}

export async function downloadInvoicePdf(input: InvoiceInput) {
  const bytes = await buildInvoicePdf(input);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Facture-${input.order.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
