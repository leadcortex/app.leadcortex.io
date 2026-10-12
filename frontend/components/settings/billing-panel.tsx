//frontend\components\settings\billing-panel.tsx
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Crown,
  Download,
  Info,
  Lightbulb,
  Receipt,
  Shield,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingButton } from "./loading-button";
import { cn } from "@/lib/utils";
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
import { PaymentLogos, VisaLogo } from "@/components/pricing-logos";
import { CompetitorTable } from "@/components/competitor-table";

const INVOICES = [
  {
    id: "INV-2026-09",
    label: "Abonnement Founder · Septembre",
    date: "1 sept. 2026",
    amount: 35.19,
  },
  {
    id: "INV-2026-08",
    label: "Abonnement Founder · Août",
    date: "1 août 2026",
    amount: 35.99,
  },
  {
    id: "INV-2026-07",
    label: "Abonnement Founder · Juillet",
    date: "1 juil. 2026",
    amount: 36.79,
  },
];

async function fakeRequest(ms = 500) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

function LoyaltySimulator({ planId, annual }: { planId: PlanId; annual: boolean }) {
  const [months, setMonths] = useState(6);
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1]!;
  const basePrice = annual ? plan.annualMonthly : plan.monthlyPrice;
  const discount = loyaltyDiscount(months);
  const currentPrice = loyaltyPrice(basePrice, months);

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">Simulateur de fidélité</p>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            {plan.name}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Plafond {LOYALTY_CAP_LABEL} après {LOYALTY_MAX_MONTHS} mois
        </span>
      </div>

      {}
      <div>
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Mois de fidélité</span>
          <span className="font-mono text-foreground">{months}</span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-emerald-500"
          aria-label="Mois de fidélité"
        />
      </div>

      {}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prix de base</p>
          <p className="mt-1 font-mono text-sm">{formatEur(basePrice)}€</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remise</p>
          <p className="mt-1 font-mono text-sm text-emerald-600 dark:text-emerald-400">
            -{Math.round(discount * 100)} %
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
          <p className="text-[10px] uppercase tracking-wider text-primary">Prix actuel</p>
          <p className="mt-1 font-mono text-sm font-semibold">{formatEur(currentPrice)}€</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Économie / an
          </p>
          <p className="mt-1 font-mono text-sm text-emerald-600 dark:text-emerald-400">
            {formatEur((basePrice - currentPrice) * 12)}€
          </p>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Votre prix baisse de <strong className="text-foreground">-2 % par mois</strong> de fidélité,
        jusqu'à un plafond de <strong className="text-foreground">{LOYALTY_CAP_LABEL}</strong>{" "}
        atteint après {LOYALTY_MAX_MONTHS} mois. Aucune action requise — la remise s'applique
        automatiquement.
      </p>
    </div>
  );
}

function PlanCardCompact({
  plan,
  active,
  annual,
  onSelect,
}: {
  plan: Plan;
  active: boolean;
  annual: boolean;
  onSelect: () => void;
}) {
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;
  const fullPrice = plan.monthlyPrice;
  const savings = annual ? plan.annualSavings : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "relative flex flex-col rounded-xl border p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary/[0.04] shadow-sm"
          : "border-border hover:border-primary/30 hover:bg-surface/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{plan.name}</p>
        {active && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
            Actuel
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-xl">{formatEur(price)}€</span>
        <span className="text-[10px] text-muted-foreground">/mois</span>
      </div>

      {annual && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground line-through">
            {formatEur(fullPrice)}€
          </span>
          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
            {plan.annualDiscountLabel}
          </span>
        </div>
      )}

      {annual && savings > 0 && (
        <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400">
          Économie : {formatEur(savings)}€/an
        </p>
      )}

      <ul className="mt-3 space-y-1">
        {plan.highlights.slice(0, 3).map((h) => (
          <li key={h} className="flex items-start gap-1.5 text-[11px]">
            <Check className="mt-0.5 size-2.5 shrink-0 text-emerald-500" strokeWidth={3} />
            <span className="text-muted-foreground">{h}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function BillingCycleDetails({ plan, annual }: { plan: Plan; annual: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface/30 p-4">
      <div className="flex items-center gap-2">
        <Info className="size-3.5 text-primary" />
        <p className="text-xs font-semibold">Détail du cycle sélectionné</p>
      </div>

      {annual ? (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prix mensuel plein</span>
            <span className="font-mono text-muted-foreground line-through">
              {formatEur(plan.monthlyPrice)}€
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Remise annuelle ({plan.annualDiscountLabel})
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              -{formatEur(plan.monthlyPrice - plan.annualMonthly)}€
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="font-medium">Prix mensuel équivalent</span>
            <span className="font-mono font-semibold">{formatEur(plan.annualMonthly)}€</span>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/[0.06] p-2.5">
            <span className="text-xs font-medium">Total débité (12 mois)</span>
            <span className="font-mono text-sm font-semibold text-primary">
              {formatEur(plan.annualPrice)}€
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Montant prélevé une fois par an. Aucun remboursement au prorata en cas de résiliation en
            cours de cycle.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prix mensuel</span>
            <span className="font-mono font-semibold">{formatEur(plan.monthlyPrice)}€</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Engagement</span>
            <span className="font-medium text-foreground">Aucun</span>
          </div>
          {}
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-2.5">
            <Lightbulb
              className="mt-px size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              En passant à l'annuel, vous économiseriez{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {formatEur(plan.annualSavings)}€
              </strong>{" "}
              sur 12 mois.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function BillingPanel() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("founder");
  // ⚠️ Défaut MENSUEL — ne pas passer à `true`.
  const [isAnnual, setIsAnnual] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [changingCard, setChangingCard] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[1]!;
  const activePlan = PLANS[1]!;

  const confirmChange = async () => {
    setUpgrading(true);
    const t = toast.loading("Application du nouveau forfait…");
    await fakeRequest(900);
    toast.dismiss(t);
    setUpgrading(false);
    setConfirming(false);
    toast.success(`Forfait ${plan.name} activé`);
  };

  const changeCard = async () => {
    setChangingCard(true);
    const t = toast.loading("Ouverture du portail de paiement…");
    await fakeRequest(700);
    toast.dismiss(t);
    setChangingCard(false);
    toast.info("Portail de paiement bientôt disponible");
  };

  const downloadInvoice = async (inv: (typeof INVOICES)[number]) => {
    const t = toast.loading(`Téléchargement de ${inv.id}…`);
    await fakeRequest(600);
    toast.dismiss(t);
    toast.success(`Facture ${inv.id} téléchargée`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/0 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background shadow-sm">
              <Crown className="size-5 text-primary" />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Forfait actuel
              </p>
              <p className="text-lg font-semibold">{activePlan.name}</p>
              <p className="text-xs text-muted-foreground">
                Renouvellement le 12 octobre 2026 · {formatEur(activePlan.monthlyPrice)}€/mois
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="size-3" />
              -12 % fidélité
            </span>
          </div>
        </div>
      </section>

      <LoyaltySimulator planId={selectedPlan} annual={isAnnual} />

      <section className="rounded-2xl border border-border bg-background p-4 md:p-5">
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Changer de forfait</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Changement immédiat, sans engagement. Le prorata est appliqué automatiquement.
              </p>
            </div>
            <span className="rounded-full bg-surface/60 px-2.5 py-1 text-[10px] text-muted-foreground">
              Remises cumulables
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCardCompact
              key={p.id}
              plan={p}
              active={p.id === selectedPlan}
              annual={isAnnual}
              onSelect={() => setSelectedPlan(p.id)}
            />
          ))}
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/40 p-1">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                aria-pressed={!isAnnual}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  !isAnnual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Calendar className="size-3" />
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                aria-pressed={isAnnual}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  isAnnual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Calendar className="size-3" />
                Annuel
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                  {plan.annualDiscountLabel}
                </span>
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {isAnnual
              ? "Vous serez débité une fois pour 12 mois. Aucun remboursement au prorata."
              : "Sans engagement — vous pouvez changer ou résilier à tout moment."}
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <BillingCycleDetails plan={plan} annual={isAnnual} />

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background p-4 lg:w-[260px]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total {isAnnual ? "annuel" : "mensuel"}
              </p>
              <p className="mt-1 font-display text-2xl">
                {formatEur(isAnnual ? plan.annualPrice : plan.monthlyPrice)}€
              </p>
              {isAnnual && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  soit {formatEur(plan.annualMonthly)}€/mois
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => setConfirming(true)}
              disabled={plan.id === activePlan.id && isAnnual === false}
            >
              Confirmer <ArrowRight />
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/20 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Moyens de paiement</h3>
          <LoadingButton
            size="sm"
            variant="outline"
            loading={changingCard}
            loadingText="Ouverture…"
            onClick={() => void changeCard()}
          >
            <CreditCard className="mr-1.5 size-3.5" /> Modifier
          </LoadingButton>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border p-3.5">
          <span className="grid h-9 w-14 shrink-0 place-items-center rounded-lg border border-black/10 bg-white p-1.5 shadow-sm">
            <VisaLogo />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Visa •••• 4242</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Expire 08/28</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
            Par défaut
          </span>
        </div>

        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Moyens acceptés
          </p>
          <PaymentLogos size="sm" className="!justify-start" />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface/60 px-2.5 py-1 text-[10px] text-muted-foreground">
          <Shield className="size-3" /> Paiement sécurisé
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface/60 px-2.5 py-1 text-[10px] text-muted-foreground">
          <Sparkles className="size-3" /> Sans engagement
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface/60 px-2.5 py-1 text-[10px] text-muted-foreground">
          <Receipt className="size-3" /> Facture automatique
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-700 dark:text-emerald-400">
          <TrendingDown className="size-3" /> Cumul annuel + fidélité
        </span>
      </div>

      <section className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/20 md:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
            Comparaison honnête
          </p>
          <h3 className="mt-1 font-display text-lg italic">Ce que vous payez ailleurs.</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Prix publics constatés en janvier 2026, hors promotions. Mis à jour régulièrement.
          </p>
        </div>
        <CompetitorTable compact />
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Les marques citées appartiennent à leurs propriétaires respectifs.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/20 md:p-5">
        <h3 className="mb-3 text-sm font-semibold">Historique de facturation</h3>
        <ul className="divide-y divide-border">
          {INVOICES.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{inv.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {inv.date} · {inv.id}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium">{formatEur(inv.amount)}€</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Télécharger la facture ${inv.id}`}
                  onClick={() => void downloadInvoice(inv)}
                >
                  <Download className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => void confirmChange()}
        title={`Passer au forfait ${plan.name} ?`}
        description={
          isAnnual
            ? `Vous serez facturé ${formatEur(plan.annualPrice)}€ pour 12 mois au forfait ${plan.name} (${formatEur(plan.annualMonthly)}€/mois équivalent, soit une remise de ${plan.annualDiscountLabel} vs mensuel). Le changement est immédiat, le prorata est appliqué. Votre réduction fidélité est conservée.`
            : `Vous serez facturé ${formatEur(plan.monthlyPrice)}€/mois au forfait ${plan.name}. Le changement est immédiat, le prorata est appliqué. Votre réduction fidélité est conservée.`
        }
        confirmLabel={isAnnual ? `Payer ${formatEur(plan.annualPrice)}€` : "Confirmer"}
        cancelLabel="Annuler"
        variant="default"
      />
    </div>
  );
}
