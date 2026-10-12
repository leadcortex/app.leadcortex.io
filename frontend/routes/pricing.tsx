//frontend\routes\pricing.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Minus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Zap,
  ChevronRight,
  Calculator,
  Calendar,
  CreditCard,
  ArrowRight,
  Info,
  Percent,
  Wallet,
  HelpCircle,
} from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
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
} from "@/lib/pricing-strategy";
import { PaymentLogos } from "@/components/pricing-logos";
import { CompetitorTable } from "@/components/competitor-table";
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
  const [months, setMonths] = useState(0);
  const isFounder = plan.id === "founder";

  const basePrice = annual ? plan.annualMonthly : plan.monthlyPrice;
  const loyalty = loyaltyDiscount(months);
  const currentPrice = loyaltyPrice(basePrice, months);

  const fullPrice = plan.monthlyPrice;
  const percentOfFull = Math.max(0, Math.min(1, currentPrice / fullPrice));

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

        {annual ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm text-muted-foreground line-through">
                {formatEur(plan.monthlyPrice)}€
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="size-3" />-{Math.round(plan.annualDiscount * 100)} % vs
                mensuel
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Facturé{" "}
              <strong className="text-foreground">
                {formatEur(plan.annualPrice)}€ pour 12 mois
              </strong>
              {" · "}vous économisez{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatEur(plan.annualSavings)}€
              </strong>{" "}
              sur l'année.
            </p>
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Facturé mensuellement, sans engagement.{" "}
            <span className="text-foreground">
              En annuel : <strong>{formatEur(plan.annualMonthly)}€/mois</strong>
            </span>{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              (économisez {formatEur(plan.annualSavings)}€)
            </span>
          </p>
        )}

        <div className="pt-1">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Prix plein</span>
            <span>Vous payez</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              style={{ width: `${percentOfFull * 100}%` }}
            />
          </div>
        </div>

        {months === 0 ? (
          <button
            type="button"
            onClick={() => setMonths(3)}
            className="inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-2 hover:text-primary/80"
          >
            <Sparkles className="size-3" />
            Voir le prix après 3 mois de fidélité
          </button>
        ) : (
          <div className="space-y-1">
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="mr-1 inline size-3" />-{Math.round(loyalty * 100)} % fidélité
              appliqué (mois {months})
            </p>
            <button
              type="button"
              onClick={() => setMonths(0)}
              className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Réinitialiser le simulateur
            </button>
          </div>
        )}
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

/* ═══════════════════════════════════════════════════════════════════════════
   TOGGLE CYCLE
   ═══════════════════════════════════════════════════════════════════════════ */

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

      <p className="max-w-md text-center text-xs text-muted-foreground">
        {annual ? (
          <>
            Facturation <strong className="text-foreground">annuelle</strong> — vous payez une fois
            pour 12 mois. Le taux de remise dépend du plan (voir détail ci-dessous).
          </>
        ) : (
          <>
            Facturation <strong className="text-foreground">mensuelle</strong> — vous pouvez changer
            ou résilier à tout moment, sans frais.
          </>
        )}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMMENT ÇA MARCHE — bloc pédagogique
   ═══════════════════════════════════════════════════════════════════════════ */

function HowItWorks() {
  const steps = [
    {
      icon: Calendar,
      title: "1. Vous choisissez votre cycle",
      desc: "Soit vous payez chaque mois, soit vous réglez 12 mois d'avance. La facturation mensuelle reste modifiable à tout moment.",
    },
    {
      icon: Percent,
      title: "2. La remise annuelle s'applique",
      desc: "En annuel, la réduction dépend de votre plan : -10 % sur Starter, -20 % sur Founder, -35 % sur Studio. Plus votre usage est important, plus l'économie est forte.",
    },
    {
      icon: TrendingDown,
      title: "3. La fidélité baisse encore le prix",
      desc: "Chaque mois d'abonnement actif applique -2 % supplémentaires (plafonné à -20 % après 10 mois). Cumulable avec la remise annuelle.",
    },
    {
      icon: ShieldCheck,
      title: "4. Vous restez libre",
      desc: "Aucun engagement de durée. Vous pouvez passer au cycle mensuel ou résilier à tout moment depuis Réglages → Facturation.",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-10 text-center md:mb-14">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
            Comment ça marche
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight md:text-5xl">
            Deux remises. <span className="italic">Cumulables.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Comprendre votre prix en 30 secondes — sans avoir besoin de lire les petites lignes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/20"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIMULATEUR INTERACTIF
   ═══════════════════════════════════════════════════════════════════════════ */

function InteractiveSimulator() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("founder");
  const [months, setMonths] = useState(12);
  const [annual, setAnnual] = useState(true);

  const plan = PLANS.find((p) => p.id === selectedPlanId)!;

  // Prix appliqués
  const basePrice = annual ? plan.annualMonthly : plan.monthlyPrice;
  const loyalty = loyaltyDiscount(months);
  const finalPrice = loyaltyPrice(basePrice, months);

  // Comparaison vs prix plein mensuel (référence utilisateur)
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
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          Faites glisser les curseurs pour voir votre prix final évoluer en temps réel.
        </p>
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

          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/30 p-4 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              En {annual ? "annuel" : "mensuel"}, le prix est{" "}
              <strong className="text-foreground">{formatEur(finalPrice)}€/mois</strong> soit{" "}
              <strong className="text-foreground">{formatEur(finalPrice * 12)}€/an</strong>.{" "}
              {loyalty === 0 &&
                "Ajoutez des mois de fidélité pour voir le prix baisser automatiquement."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABLEAU COMPARATIF — mensuel vs annuel
   ═══════════════════════════════════════════════════════════════════════════ */

function ComparisonTable() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-8 text-center md:mb-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
            Comparaison directe
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight md:text-4xl">
            Mensuel vs Annuel, <span className="italic">côte à côte</span>.
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-background scrollbar-hide">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/40 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3 md:px-6">Plan</th>
                <th className="px-4 py-3 text-right md:px-6">Prix mensuel</th>
                <th className="px-4 py-3 text-right md:px-6">Prix annuel / mois</th>
                <th className="px-4 py-3 text-right md:px-6">Total annuel</th>
                <th className="px-4 py-3 text-right md:px-6">Économie sur 12 mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PLANS.map((plan) => (
                <tr key={plan.id} className="transition-colors hover:bg-surface/30">
                  <td className="px-4 py-4 md:px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {plan.annualDiscountLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono md:px-6">
                    {formatEur(plan.monthlyPrice)}€
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground md:px-6">
                    <span className="font-semibold">{formatEur(plan.annualMonthly)}€</span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-muted-foreground md:px-6">
                    {formatEur(plan.annualPrice)}€
                  </td>
                  <td className="px-4 py-4 text-right md:px-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <TrendingDown className="size-3" />
                      {formatEur(plan.annualSavings)}€
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Remises annuelles : Starter -10 %, Founder -20 %, Studio -35 %. Cumulables avec la remise
          fidélité (-2 %/mois, plafond -20 %).
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION FIDÉLITÉ — refonte visuelle
   ═══════════════════════════════════════════════════════════════════════════ */

function LoyaltySection() {
  const timeline = [
    { months: 0, label: "Mois 1", discount: "0 %", note: "Prix plein" },
    { months: 2, label: "Mois 2", discount: "-2 %", note: "" },
    { months: 5, label: "Mois 5", discount: "-10 %", note: "" },
    { months: 10, label: "Mois 10+", discount: "-20 %", note: "Plafond" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="size-4" strokeWidth={2} />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                Prix dégressif
              </p>
            </div>
            <h3 className="mt-3 font-display text-2xl italic leading-tight md:text-4xl">
              Votre prix baisse <span className="italic">chaque mois</span>.
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              En plus de la remise annuelle, votre mensualité diminue automatiquement de{" "}
              <strong className="text-foreground">-2 % par mois</strong> de fidélité. Le plafond est
              atteint à <strong className="text-foreground">-20 % après 10 mois</strong>.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Aucune action requise — la remise est appliquée automatiquement sur vos factures. Elle
              reste acquise tant que votre abonnement est actif, y compris lors d'un changement de
              plan.
            </p>

            <div className="mt-6 space-y-3">
              <div className="relative h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-500"
                  style={{ width: "100%" }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                {timeline.map((t) => (
                  <div key={t.label}>
                    <p className="text-muted-foreground">{t.label}</p>
                    <p
                      className={`mt-1 font-mono font-semibold ${
                        t.discount === "0 %"
                          ? "text-muted-foreground"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {t.discount}
                    </p>
                    {t.note && (
                      <p className="mt-0.5 text-[9px] text-muted-foreground/70">{t.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-[240px] rounded-2xl border border-border bg-background p-5 text-center">
              <Wallet className="mx-auto size-8 text-emerald-500" strokeWidth={1.5} />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Exemple concret
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Plan Founder, annuel</p>
              <div className="mt-3 space-y-1.5 text-left text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mois 1</span>
                  <span className="font-mono">{formatEur(PLANS[1].annualMonthly)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Après 10 mois</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatEur(PLANS[1].annualMonthly * 0.8)}€
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5">
                  <span className="font-medium">Économie</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    -20 %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ PRIX
   ═══════════════════════════════════════════════════════════════════════════ */

function PricingFaq() {
  const faqs = [
    {
      q: "Comment fonctionne exactement la remise annuelle ?",
      a: "Si vous choisissez la facturation annuelle, vous payez une fois pour 12 mois et bénéficiez immédiatement d'une réduction sur chaque mensualité équivalente. Cette réduction dépend de votre plan : -10 % sur Starter, -20 % sur Founder, -35 % sur Studio. Le montant total débité est affiché avant toute confirmation — jamais de surprise.",
    },
    {
      q: "Est-ce que la remise annuelle se cumule avec la remise fidélité ?",
      a: "Oui. La remise annuelle (dépendante du plan) s'applique en premier, puis la remise fidélité (-2 % par mois de présence, plafonnée à -20 % après 10 mois) s'applique sur le prix déjà réduit. Exemple : un plan Founder en annuel après 10 mois de fidélité paie 31,99 € × 0,80 = 25,59 €/mois.",
    },
    {
      q: "Puis-je changer de cycle en cours d'abonnement ?",
      a: "Oui, à tout moment depuis Réglages → Facturation. Un passage mensuel → annuel est immédiat avec prorata. Un passage annuel → mensuel prend effet à la fin des 12 mois déjà payés (aucun remboursement au prorata sur le cycle annuel en cours).",
    },
    {
      q: "Que se passe-t-il si je résilie en cours d'année ?",
      a: "Vous conservez l'accès jusqu'à la fin des 12 mois déjà payés. Aucun remboursement n'est effectué sur le cycle annuel — c'est la contrepartie de la remise. Vous pouvez néanmoins résilier le renouvellement à tout moment pour qu'il ne se reproduise pas.",
    },
    {
      q: "La remise fidélité est-elle perdue si je change de plan ?",
      a: "Non. Votre ancienneté est conservée lors d'un changement de plan. Si vous étiez à -12 % de fidélité sur Founder et passez sur Studio, vous continuez à -12 % sur Studio. La remise reste attachée à votre compte, pas au plan.",
    },
    {
      q: "Comment est calculé le prix affiché dans le simulateur ?",
      a: "Prix final = (prix mensuel ou annuel-mensuel) × (1 − remise fidélité). En annuel, la remise annuelle est déjà intégrée dans le prix annuel-mensuel. Le simulateur utilise exactement la même formule que le moteur de facturation.",
    },
    {
      q: "Y a-t-il des frais cachés ?",
      a: "Non. Le prix affiché est le prix payé. Pas de frais d'installation, pas de frais de changement de plan, pas de marge cachée sur les tokens IA (les clés BYOK sont facturées directement par votre fournisseur).",
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

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

function PricingPage() {
  // ⚠️ Défaut = MENSUEL — ne pas passer à `true`.
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-16 md:px-6 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3" />
            Prix dégressif · Sans engagement · Remise annuelle jusqu'à -35 %
          </div>
          <h1 className="mt-5 font-display text-4xl leading-[0.95] tracking-tight md:text-7xl">
            Un prix honnête.
            <br />
            <span className="italic text-primary">Qui baisse avec le temps.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[54ch] text-base text-muted-foreground md:text-lg">
            Deux remises cumulables. Zéro frais caché. Toutes les formules affichées, tous les
            calculs visibles — vous savez exactement ce que vous payez et pourquoi.
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
              <span>Paiement 100 % sécurisé · Données chiffrées · Aucun engagement</span>
            </div>
            <PaymentLogos size="md" className="md:justify-end" />
          </div>
        </div>
      </section>

      <HowItWorks />

      <InteractiveSimulator />

      <ComparisonTable />

      <LoyaltySection />

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
              Les prix affichés sont ceux publiquement disponibles en janvier 2026, hors promotions.
              Nous les mettons à jour régulièrement.
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
          50 crédits offerts. Aucune carte bancaire. Modèles inclus par défaut, BYOK disponible en
          30 secondes.
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
