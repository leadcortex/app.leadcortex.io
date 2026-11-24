// frontend/components/payment/billing-page.tsx

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PaymentLogos } from "@/components/marketing/pricing-logos";
import {
  Calendar,
  Download,
  Receipt,
  RotateCcw,
  Shield,
  TrendingDown,
  X,
} from "@/components/icons";
import { TicketPrinter, type PrinterStatus } from "@/components/payment/ticket-printer";
import { CustomPlanBuilder } from "@/components/payment/custom-plan-builder";
import { LoyaltyStairs } from "@/components/payment/loyalty-stairs";
import { PaymentDesk } from "@/components/payment/payment-desk";
import { PlanLadder } from "@/components/payment/plan-ladder";
import { PriceCompare } from "@/components/payment/price-compare";
import { cn } from "@/lib/core/utils";
import {
  CUSTOM_ANNUAL_DISCOUNT,
  CUSTOM_BASE,
  CUSTOM_MODULES,
  chosenOption,
  defaultSelection,
  type CustomSelection,
} from "@/lib/data/custom-plan";
import { getPlan, loyaltyDiscount, type PlanId } from "@/lib/data/pricing-strategy";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSettings } from "@/components/settings/settings-context";
import {
  LOYALTY_MONTHS_SIM,
  buildCustomOrder,
  buildPlanOrder,
  eur,
  formatDateFr,
  nextCharge,
  type Cycle,
  type Order,
} from "@/lib/payment/order";

type Mode = "plans" | "custom";

type Current = { kind: "plan"; planId: PlanId; cycle: Cycle } | { kind: "custom" };

type Props = {
  onClose?: () => void;
  embedded?: boolean;
};

const INVOICES = [
  { id: "INV-2026-10", label: "Abonnement Founder · Octobre", date: "12 oct. 2026", amount: 35.19 },
  {
    id: "INV-2026-09",
    label: "Abonnement Founder · Septembre",
    date: "12 sept. 2026",
    amount: 35.99,
  },
  { id: "INV-2026-08", label: "Abonnement Founder · Août", date: "12 août 2026", amount: 36.79 },
];

function SectionHead({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{kicker}</p>
        <h3 className="mt-1 font-display text-[26px] italic leading-tight md:text-[30px]">
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}

function CycleToggle({
  cycle,
  onChange,
  annualLabel,
}: {
  cycle: Cycle;
  onChange: (c: Cycle) => void;
  annualLabel: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-surface/80 p-1 shadow-[inset_0_0_0_1px_var(--border)]">
      <button
        type="button"
        aria-pressed={cycle === "monthly"}
        onClick={() => onChange("monthly")}
        className={cn(
          base,
          cycle === "monthly"
            ? "bg-background font-bold text-foreground shadow-sm"
            : "font-medium text-muted-foreground hover:text-foreground",
        )}
      >
        Mensuel
      </button>
      <button
        type="button"
        aria-pressed={cycle === "annual"}
        onClick={() => onChange("annual")}
        className={cn(
          base,
          cycle === "annual"
            ? "bg-background font-bold text-foreground shadow-sm"
            : "font-medium text-muted-foreground hover:text-foreground",
        )}
      >
        <Calendar className="size-3" />
        Annuel
        <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
          {annualLabel}
        </span>
      </button>
    </div>
  );
}

function TabSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tab = (id: Mode, label: string, badge?: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={mode === id}
      onClick={() => onChange(id)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mode === id
          ? "bg-background font-bold text-foreground shadow-sm"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {badge && (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
          {badge}
        </span>
      )}
    </button>
  );
  return (
    <div
      role="tablist"
      aria-label="Type de forfait"
      className="inline-flex items-center gap-1 rounded-full bg-surface/80 p-1 shadow-[inset_0_0_0_1px_var(--border)]"
    >
      {tab("plans", "Forfaits")}
      {tab("custom", "Sur mesure", "Nouveau")}
    </div>
  );
}

function CurrentStrip({ current }: { current: Current }) {
  const discount = Math.round(loyaltyDiscount(LOYALTY_MONTHS_SIM) * 100);
  const cycle: Cycle = current.kind === "plan" ? current.cycle : "monthly";
  const name = current.kind === "plan" ? getPlan(current.planId).name : "Sur mesure";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-2xl bg-surface/50 px-4 py-3">
      <p className="text-sm">
        <span className="text-muted-foreground">Vous êtes en </span>
        <strong className="font-extrabold">{name}</strong>
        <span className="text-muted-foreground">
          {" "}
          · prochain prélèvement le {formatDateFr(nextCharge(new Date(), cycle))}
        </span>
      </p>
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success">
        <TrendingDown className="size-3" /> −{discount} % fidélité
      </span>
    </div>
  );
}

function TrustSection() {
  const downloadInvoice = (id: string) => {
    toast.success(`Facture ${id} téléchargée`);
  };
  return (
    <section className="space-y-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-foreground" /> Paiement sécurisé
        </li>
        <li className="flex items-center gap-1.5">
          <RotateCcw className="size-3.5 text-foreground" /> Résiliable à tout moment
        </li>
        <li className="flex items-center gap-1.5">
          <Receipt className="size-3.5 text-foreground" /> Facture automatique
        </li>
      </ul>

      <PaymentLogos size="sm" className="!justify-start opacity-70" />

      <details className="group rounded-2xl border border-border px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
          Dernières factures
          <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <ul className="mt-2 divide-y divide-border">
          {INVOICES.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">{inv.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {inv.date} · {inv.id}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{eur(inv.amount)}</span>
                <button
                  type="button"
                  aria-label={`Télécharger la facture ${inv.id}`}
                  onClick={() => downloadInvoice(inv.id)}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <Download className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function BillingPage({ onClose, embedded = false }: Props) {
  const { billingReceiptOpen, setBillingReceiptOpen } = useSettings();
  const user = useCurrentUser();
  const [mode, setMode] = useState<Mode>("plans");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("founder");
  const [selection, setSelection] = useState<CustomSelection>(defaultSelection);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>("idle");
  const [current, setCurrent] = useState<Current>({
    kind: "plan",
    planId: "founder",
    cycle: "monthly",
  });

  useEffect(() => {
    if (billingReceiptOpen) return;
    setReceiptOrder(null);
    setPrinterStatus("idle");
  }, [billingReceiptOpen]);

  const plan = getPlan(selectedPlanId);

  const draft = useMemo(() => {
    if (mode === "plans") return buildPlanOrder(plan, cycle);

    const items = [
      {
        id: "base",
        label: CUSTOM_BASE.label,
        detail: CUSTOM_BASE.detail,
        amount: CUSTOM_BASE.price,
      },
      ...CUSTOM_MODULES.flatMap((m) => {
        const opt = chosenOption(m, selection);
        if (opt.price <= 0) return [];
        return [
          {
            id: m.id,
            label: m.label,
            detail: m.kind === "steps" ? `${opt.label} ${m.unit ?? ""}`.trim() : undefined,
            amount: opt.price,
          },
        ];
      }),
    ];
    return buildCustomOrder({ items, cycle, annualDiscount: CUSTOM_ANNUAL_DISCOUNT });
  }, [mode, plan, cycle, selection]);

  const isCurrentPlan =
    mode === "plans" &&
    current.kind === "plan" &&
    current.planId === selectedPlanId &&
    current.cycle === cycle;

  const handlePaid = (order: Order) => {
    if (mode === "plans") {
      setCurrent({ kind: "plan", planId: selectedPlanId, cycle });
      toast.success(`Forfait ${plan.name} activé`);
    } else {
      setCurrent({ kind: "custom" });
      toast.success("Forfait sur mesure activé");
    }
    setReceiptOrder(order);
    setPrinterStatus("printing");
    setBillingReceiptOpen(true);
  };

  const annualLabel =
    mode === "plans" ? plan.annualDiscountLabel : `−${Math.round(CUSTOM_ANNUAL_DISCOUNT * 100)} %`;

  const main = (
    <div className="min-w-0 space-y-10">
      {mode === "plans" ? (
        <>
          <CurrentStrip current={current} />

          <section>
            <SectionHead
              kicker="Votre forfait"
              title="Choisissez votre niveau."
              right={<CycleToggle cycle={cycle} onChange={setCycle} annualLabel={annualLabel} />}
            />
            <PlanLadder
              cycle={cycle}
              selected={selectedPlanId}
              currentPlanId={current.kind === "plan" ? current.planId : undefined}
              onSelect={setSelectedPlanId}
            />
          </section>

          <section>
            <SectionHead kicker="Fidélité" title="Votre prix descend tout seul." />
            <LoyaltyStairs
              basePrice={cycle === "annual" ? plan.annualMonthly : plan.monthlyPrice}
              months={LOYALTY_MONTHS_SIM}
              planName={plan.name}
            />
          </section>

          <section>
            <SectionHead kicker="Comparatif" title="Ce que vous paieriez ailleurs." />
            <PriceCompare />
          </section>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <CycleToggle cycle={cycle} onChange={setCycle} annualLabel={annualLabel} />
          </div>
          <CustomPlanBuilder
            selection={selection}
            onChange={setSelection}
            onPickPlan={(id) => {
              setSelectedPlanId(id);
              setMode("plans");
            }}
          />
        </>
      )}

      <TrustSection />
    </div>
  );

  const desk = (
    <PaymentDesk
      draft={draft}
      disabledReason={isCurrentPlan ? "Votre forfait actuel" : undefined}
      onPaid={handlePaid}
    />
  );

  if (receiptOrder) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Reçu de paiement
          </p>
          <h3 className="mt-2 font-display text-2xl italic">Impression de votre ticket</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Le papier sort vers le bas et s’allonge au fur et à mesure de l’impression.
          </p>
        </div>
        <TicketPrinter
          status={printerStatus}
          order={receiptOrder}
          customer={user.fullName}
          paymentLabel="VISA •••• 4242"
          onPrinted={() => setPrinterStatus("done")}
          className="mx-auto max-w-sm"
        />
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="space-y-8">
        <TabSwitch mode={mode} onChange={setMode} />
        {main}
        {desk}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-3 md:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
          <h2 className="font-display text-[26px] italic leading-none">Facturation</h2>
          <TabSwitch mode={mode} onChange={setMode} />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la facturation"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-[18px]" strokeWidth={2} />
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          {main}
          <aside className="-mx-1 px-1 pb-8 lg:sticky lg:top-0 lg:max-h-[calc(min(94vh,900px)_-_6rem)] lg:self-start lg:overflow-y-auto scrollbar-hide">
            {desk}
          </aside>
        </div>
      </div>
    </div>
  );
}
