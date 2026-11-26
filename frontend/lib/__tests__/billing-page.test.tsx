// frontend/lib/__tests__/billing-page.test.tsx

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmStep } from "@/components/payment/checkout/order-summary";
import {
  PaymentMethodFields,
  type Bind,
} from "@/components/payment/checkout/payment-method-fields";
import { getPlan } from "@/lib/data/pricing-strategy";
import { emptyCheckout, type PaymentMethod } from "@/lib/payment/checkout";
import { buildPlanOrder } from "@/lib/payment/order";

vi.mock("@/components/settings/settings-context", () => ({
  useSettings: () => ({ billingReceiptOpen: false, setBillingReceiptOpen: () => {} }),
}));
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    fullName: "Jeanne Martin",
    email: "jeanne@exemple.fr",
    isAuthenticated: true,
  }),
}));

const draft = buildPlanOrder(getPlan("founder"), "monthly", 0);

const bindFor = (method: PaymentMethod, extra: Partial<Bind["form"]> = {}): Bind => ({
  form: { ...emptyCheckout("Jeanne Martin", "jeanne@exemple.fr"), method, ...extra },
  errors: {},
  set: () => {},
  touch: () => {},
});

const confirm = (bind: Bind) =>
  renderToStaticMarkup(
    <ConfirmStep
      draft={draft}
      planLabel="Founder · mensuel"
      bind={bind}
      phase="idle"
      transferReference="LC-ABC123"
      onEditPlan={() => {}}
      onEditDetails={() => {}}
    />,
  );

describe("page de paiement", () => {
  it("commence par le choix du forfait, sans récapitulatif", async () => {
    const { BillingPage } = await import("@/components/payment/billing-page");
    const html = renderToStaticMarkup(<BillingPage />);
    expect(html).toContain("Choisissez votre forfait");
    expect(html).toContain("Continuer");
    expect(html).not.toContain("Payer");
    expect(html).not.toContain("Prélevé automatiquement");
  });

  it("adapte les champs au moyen de paiement", () => {
    const render = (m: PaymentMethod) =>
      renderToStaticMarkup(<PaymentMethodFields bind={bindFor(m)} />);
    expect(render("card")).toContain("cc-number");
    expect(render("sepa")).toContain("IBAN");
    expect(render("sepa")).not.toContain("cc-number");
    expect(render("transfer")).toContain("étape suivante");
  });

  it("la confirmation donne les infos clés et le lien vers les conditions", () => {
    const html = confirm(bindFor("card"));
    expect(html).toContain("Prélevé automatiquement chaque mois");
    expect(html).toContain("Résiliable à tout moment");
    expect(html).toContain('href="/legal/paiement"');
    expect(html).not.toContain('disabled=""');
    expect(confirm(bindFor("transfer"))).toContain("LC-ABC123");
  });

  it("grise le bouton tant qu'un particulier n'a pas demandé l'accès immédiat", () => {
    expect(confirm(bindFor("card", { customerType: "individual" }))).toContain('disabled=""');
    expect(
      confirm(bindFor("card", { customerType: "individual", immediateStart: true })),
    ).not.toContain('disabled=""');
  });
});
