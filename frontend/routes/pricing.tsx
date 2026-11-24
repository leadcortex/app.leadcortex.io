// frontend/routes/pricing.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Minus, ShieldCheck, ChevronRight, Calendar, Percent } from "@/components/icons";
import { SiteNav, SiteFooter } from "@/components/layout/site-nav";
import { ContentPageSkeleton } from "@/components/skeletons";
import {
  PLANS,
  loyaltyDiscount,
  loyaltyPrice,
  formatEur,
  LOYALTY_CAP_LABEL,
  LOYALTY_MAX_MONTHS,
  type Plan,
  type PlanId,
} from "@/lib/data/pricing-strategy";
import { PaymentLogos } from "@/components/marketing/pricing-logos";
import { CompetitorTable } from "@/components/marketing/competitor-table";
import { LeadMascot } from "@/components/ui/lead-mascot";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs — LeadCortex" },
      {
        name: "description",
        content:
          "Tarifs honnêtes et lisibles. Remise annuelle : -10 % Starter, -20 % Founder, -35 % Studio. Prix dégressif avec la fidélité, jusqu'à -20 % supplémentaires.",
      },
      { property: "og:title", content: "Tarifs — LeadCortex" },
      {
        property: "og:description",
        content:
          "Remise annuelle jusqu'à -35 %. Prix dégressif jusqu'à -20 % de plus. Sans engagement.",
      },
    ],
  }),
  pendingComponent: () => <ContentPageSkeleton />,
  component: PricingPage,
});

function PricingCard({ plan, annual, index }: { plan: Plan; annual: boolean; index: number }) {
  const isFounder = plan.id === "founder";
  const currentPrice = annual ? plan.annualMonthly : plan.monthlyPrice;

  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 transition-all md:p-7 ${
        isFounder
          ? "border-primary/40 bg-gradient-to-b from-primary/[0.04] to-background shadow-lg"
          : "border-border bg-background hover:border-primary/20"
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {isFounder && (
        <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl italic md:text-2xl">{plan.name}</h3>
          {isFounder && (
            <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
              Recommandé
            </span>
          )}
          {annual && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Percent className="size-3" strokeWidth={2.5} />
              {plan.annualDiscountLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
          {plan.tagline}
        </p>
      </div>

      <div className="mb-5 space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl md:text-5xl">{formatEur(currentPrice)}€</span>
          <span className="text-sm text-muted-foreground">/mois</span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {annual ? "Facturé à l'année" : "Sans engagement"}
        </p>
      </div>

      <Link
        to="/signup"
        className={`mb-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
          isFounder
            ? "bg-foreground text-background hover:opacity-90"
            : "border border-border bg-background hover:bg-surface"
        }`}
      >
        {plan.ctaLabel}
        <ChevronRight className="size-4" />
      </Link>

      <ul className="flex-1 space-y-2.5">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
            <span className="text-foreground/90">{h}</span>
          </li>
        ))}
      </ul>

      {plan.limitations.length > 0 && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Non inclus
          </p>
          <ul className="space-y-1.5">
            {plan.limitations.map((l) => (
              <li key={l} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <Minus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/40 p-1">
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!annual}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all md:px-5 ${
            !annual
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="size-3.5" />
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={annual}
          className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all md:px-5 ${
            annual
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="size-3.5" />
          Annuel
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            jusqu'à -35 %
          </span>
        </button>
      </div>
    </div>
  );
}

function InteractiveSimulator() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("founder");
  const [months, setMonths] = useState(12);
  const [annual, setAnnual] = useState(true);

  const plan = PLANS.find((p) => p.id === selectedPlanId)!;

  const basePrice = annual ? plan.annualMonthly : plan.monthlyPrice;
  const loyalty = loyaltyDiscount(months);
  const finalPrice = loyaltyPrice(basePrice, months);

  const referencePrice = plan.monthlyPrice;
  const totalSavedPerMonth = referencePrice - finalPrice;
  const totalSavedOverYear = totalSavedPerMonth * 12;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <div className="mb-8 text-center md:mb-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
          Simulateur
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight md:text-5xl">
          Combien <span className="italic">vous payez vraiment</span>.
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div className="space-y-6 rounded-2xl border border-border bg-background p-5 md:p-7">
          <div>
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              1. Votre plan
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => {
                const active = p.id === selectedPlanId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    aria-pressed={active}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/[0.05] shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-surface/40"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatEur(p.monthlyPrice)}€/mois
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              2. Cycle de facturation
            </p>
            <div className="inline-flex w-full rounded-xl border border-border bg-surface/40 p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                aria-pressed={!annual}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  !annual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                aria-pressed={annual}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  annual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuel ({plan.annualDiscountLabel})
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                3. Mois de fidélité
              </p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {months} mois
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              aria-label="Mois de fidélité"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
            />
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>Mois 0</span>
              <span>Mois {LOYALTY_MAX_MONTHS} (plafond atteint)</span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Remise fidélité :{" "}
              <strong className="text-foreground">-{Math.round(loyalty * 100)} %</strong> (plafond{" "}
              {LOYALTY_CAP_LABEL})
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] to-background p-6 md:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Votre prix final
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-5xl md:text-6xl">{formatEur(finalPrice)}€</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>

            <div className="mt-5 space-y-2 border-t border-border/60 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prix de référence</span>
                <span className="font-mono text-foreground">{formatEur(referencePrice)}€</span>
              </div>
              {annual && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Remise annuelle ({plan.annualDiscountLabel})
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    -{formatEur(referencePrice - plan.annualMonthly)}€
                  </span>
                </div>
              )}
              {loyalty > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Remise fidélité (-{Math.round(loyalty * 100)} %)
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    -{formatEur(basePrice * loyalty)}€
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                <span className="font-medium text-foreground">Vous payez</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatEur(finalPrice)}€
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-500/[0.08] p-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                Vous économisez par an
              </p>
              <p className="mt-1 font-display text-2xl text-emerald-700 dark:text-emerald-400">
                {formatEur(totalSavedOverYear)}€
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingFaq() {
  const faqs = [
    {
      q: "Les deux remises se cumulent ?",
      a: "Oui. La remise annuelle s'applique d'abord, puis la remise fidélité. Le simulateur ci-dessus fait le calcul.",
    },
    {
      q: "Puis-je changer de plan ou de cycle ?",
      a: "Oui, à tout moment depuis Réglages → Facturation. Votre ancienneté est conservée.",
    },
    {
      q: "Et si je résilie en cours d'année ?",
      a: "Vous gardez l'accès jusqu'à la fin de la période payée. L'annuel n'est pas remboursé au prorata.",
    },
    {
      q: "Y a-t-il des frais cachés ?",
      a: "Non. Avec vos propres clés IA, vous payez votre fournisseur directement, sans marge de notre part.",
    },
  ];

  return (
    <section className="border-t border-border/60 bg-surface/30">
      <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-10 flex items-center gap-4 md:mb-12">
          <div className="hidden shrink-0 md:block">
            <LeadMascot
              pose="thoughtful"
              preserveAspectRatio="xMidYMid meet"
              className="h-[120px] w-auto"
            />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
              Questions tarifaires
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight tracking-tight md:text-4xl">
              Tout est <span className="italic">clair</span>.
            </h2>
          </div>
        </div>

        <Accordion
          type="single"
          collapsible
          className="rounded-2xl border border-border bg-background px-5 md:px-6"
        >
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className={i === faqs.length - 1 ? "border-b-0" : ""}
            >
              <AccordionTrigger className="py-5 text-left text-sm font-medium md:text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-xs leading-relaxed text-muted-foreground md:text-sm">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-16 md:px-6 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl leading-[0.95] tracking-tight md:text-7xl">
            Un prix honnête.
            <br />
            <span className="italic text-primary">Qui baisse avec le temps.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[54ch] text-base text-muted-foreground md:text-lg">
            Sans engagement. Sans frais cachés.
          </p>

          <div className="mt-8 flex justify-center">
            <BillingToggle annual={annual} onChange={setAnnual} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} annual={annual} index={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="rounded-2xl border border-border bg-surface/30 p-5 md:p-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2 text-center text-sm text-muted-foreground md:text-left">
              <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
              <span>Paiement sécurisé</span>
            </div>
            <PaymentLogos size="md" className="md:justify-end" />
          </div>
        </div>
      </section>

      <InteractiveSimulator />

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
              Comparaison honnête
            </p>
            <h2 className="mt-3 font-display text-3xl italic md:text-5xl">
              Ce que vous payez ailleurs.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Prix publics relevés en janvier 2026, hors promotions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 md:p-6">
            <CompetitorTable />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Les marques citées appartiennent à leurs propriétaires respectifs. Comparaison à titre
            informatif.
          </p>
        </div>
      </section>

      <PricingFaq />

      <section className="mx-auto max-w-7xl px-4 py-16 text-center md:px-6 md:py-24">
        <div className="mb-6 flex justify-center md:mb-8">
          <LeadMascot
            pose="motivated"
            preserveAspectRatio="xMidYMid meet"
            className="lc-float h-[140px] w-auto md:h-[180px]"
          />
        </div>
        <h2 className="font-display text-3xl italic md:text-6xl">
          Prêt à faire baisser votre prix ?
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-sm text-muted-foreground">
          Essai gratuit. Sans carte bancaire.
        </p>
        <div className="mt-8">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-all hover:opacity-90"
          >
            Créer mon workspace
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @keyframes lc-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .lc-float { animation: lc-float 5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
