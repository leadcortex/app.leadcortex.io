// frontend/components/payment/billing-page.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Download, Loader2 } from "@/components/icons";
import { BillingFields } from "@/components/payment/checkout/billing-fields";
import { Group } from "@/components/payment/checkout/fields";
import { MoreInfo } from "@/components/payment/checkout/more-info";
import { ConfirmStep, type PayPhase } from "@/components/payment/checkout/order-summary";
import {
  PaymentMethodFields,
  type Bind,
} from "@/components/payment/checkout/payment-method-fields";
import { CycleSwitch, PlanPicker } from "@/components/payment/checkout/plan-picker";
import { CustomPlanBuilder } from "@/components/payment/custom-plan-builder";
import { TicketPrinter, type PrinterStatus } from "@/components/payment/ticket-printer";
import { useSettings } from "@/components/settings/settings-context";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/core/utils";
import {
  CUSTOM_ANNUAL_DISCOUNT,
  CUSTOM_BASE,
  CUSTOM_MODULES,
  chosenOption,
  defaultSelection,
  type CustomSelection,
} from "@/lib/data/custom-plan";
import { getPlan, type PlanId } from "@/lib/data/pricing-strategy";
import {
  TRANSFER_STEPS,
  canConfirm,
  emptyCheckout,
  paymentLabel,
  validateDetails,
  type CheckoutForm,
  type PaymentMethod,
} from "@/lib/payment/checkout";
import {
  buildCustomOrder,
  buildPlanOrder,
  stampOrder,
  type Cycle,
  type Order,
} from "@/lib/payment/order";

type PlanMode = "plans" | "custom";
type Step = 0 | 1 | 2;
type Receipt = { order: Order; label: string; method: PaymentMethod };

const STEPS = ["Forfait", "Coordonnées", "Confirmation"] as const;
const NEW_CUSTOMER_LOYALTY = 0;
const TRANSFER_STEP_MS = 1500;
const PROCESSING_MS: Record<PaymentMethod, number> = { card: 1400, sepa: 1200, transfer: 700 };

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function makeTransferReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LC-${s}`;
}

function Stepper({ step, onBack }: { step: Step; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Étape précédente"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-foreground",
          step === 0 && "invisible",
        )}
      >
        <ArrowLeft className="size-4" />
      </button>
      <ol className="flex flex-1 items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "text-[12px] transition-colors",
                i === step ? "font-semibold text-foreground" : "text-muted-foreground/70",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-5 bg-border" />}
          </li>
        ))}
      </ol>
      <span className="size-8 shrink-0" />
    </div>
  );
}

function TransferSteps({ done }: { done: number }) {
  return (
    <ol className="space-y-2.5" aria-live="polite">
      {TRANSFER_STEPS.map((s, i) => {
        const state = i < done ? "done" : i === done ? "active" : "todo";
        return (
          <li key={s.id} className="flex items-center gap-3 text-[13px]">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                state === "done" && "border-success bg-success text-white",
                state === "active" && "border-primary text-primary",
                state === "todo" && "border-border text-muted-foreground",
              )}
            >
              {state === "done" ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : state === "active" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="text-[10px] font-semibold">{i + 1}</span>
              )}
            </span>
            <span className={cn(state === "todo" ? "text-muted-foreground" : "font-medium")}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ReceiptView({
  receipt,
  customer,
  form,
}: {
  receipt: Receipt;
  customer: string;
  form: CheckoutForm;
}) {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      const { downloadInvoicePdf } = await import("@/lib/payment/invoice-pdf");
      await downloadInvoicePdf({ order: receipt.order, form, paymentLabel: receipt.label });
    } catch {
      toast.error("Le PDF n'a pas pu être généré");
    } finally {
      setDownloading(false);
    }
  };
  const isTransfer = receipt.method === "transfer";
  const [status, setStatus] = useState<PrinterStatus>("printing");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isTransfer) return;
    const timer = window.setInterval(() => {
      setStep((s) => {
        const next = Math.min(TRANSFER_STEPS.length, s + 1);
        if (next === TRANSFER_STEPS.length) window.clearInterval(timer);
        return next;
      });
    }, TRANSFER_STEP_MS);
    return () => window.clearInterval(timer);
  }, [isTransfer]);

  const done = status === "done";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl italic">
          {done ? "C'est fait." : isTransfer ? "Vérification du virement…" : "Paiement accepté"}
        </h3>
        {done && <p className="mt-1.5 text-sm text-muted-foreground">Reçu envoyé par e-mail.</p>}
      </div>

      {isTransfer && !done && (
        <div className="mx-auto w-fit">
          <TransferSteps done={step} />
        </div>
      )}

      <TicketPrinter
        status={status}
        order={receipt.order}
        customer={customer}
        paymentLabel={receipt.label}
        progress={isTransfer ? step / TRANSFER_STEPS.length : undefined}
        onPrinted={() => setStatus("done")}
        className="mx-auto max-w-sm"
      />

      {done && (
        <div className="flex justify-center animate-in fade-in duration-300">
          <Button variant="outline" disabled={downloading} onClick={() => void download()}>
            <Download /> Télécharger la facture
          </Button>
        </div>
      )}
    </div>
  );
}

export function BillingPage() {
  const { setBillingReceiptOpen, billingReceiptOpen } = useSettings();
  const user = useCurrentUser();
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(0);
  const [planMode, setPlanMode] = useState<PlanMode>("plans");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [planId, setPlanId] = useState<PlanId>("founder");
  const [selection, setSelection] = useState<CustomSelection>(defaultSelection);

  const [form, setForm] = useState<CheckoutForm>(() =>
    emptyCheckout(user.isAuthenticated ? user.fullName : "", user.email ?? ""),
  );
  const [touched, setTouched] = useState<Set<keyof CheckoutForm>>(() => new Set());
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [transferReference] = useState(makeTransferReference);

  useEffect(() => {
    if (!billingReceiptOpen) setReceipt(null);
  }, [billingReceiptOpen]);

  const plan = getPlan(planId);
  const planLabel =
    `${planMode === "plans" ? plan.name : "Sur mesure"} · ` +
    (cycle === "annual" ? "annuel" : "mensuel");

  const draft = useMemo(() => {
    if (planMode === "plans") return buildPlanOrder(plan, cycle, NEW_CUSTOMER_LOYALTY);
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
    return buildCustomOrder({
      items,
      cycle,
      annualDiscount: CUSTOM_ANNUAL_DISCOUNT,
      loyaltyMonths: NEW_CUSTOMER_LOYALTY,
    });
  }, [planMode, plan, cycle, selection]);

  const allErrors = useMemo(() => validateDetails(form), [form]);
  const detailsValid = Object.keys(allErrors).length === 0;
  const errors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(allErrors).filter(([k]) => touched.has(k as keyof CheckoutForm)),
      ),
    [allErrors, touched],
  );

  const bind: Bind = {
    form,
    errors,
    set: (key, value) => setForm((f) => ({ ...f, [key]: value })),
    touch: (key) => setTouched((t) => (t.has(key) ? t : new Set(t).add(key))),
  };

  const go = (s: Step) => {
    setStep(s);
    topRef.current?.scrollIntoView({ block: "start" });
  };

  const annualBadge =
    planMode === "plans"
      ? plan.annualDiscountLabel.replace("-", "−")
      : `−${Math.round(CUSTOM_ANNUAL_DISCOUNT * 100)} %`;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 2 || phase === "processing" || !detailsValid) return;
    if (!canConfirm(form)) return;
    setPhase("processing");
    await wait(PROCESSING_MS[form.method]);
    setPhase("idle");
    setReceipt({ order: stampOrder(draft), label: paymentLabel(form), method: form.method });
    setBillingReceiptOpen(true);
  };

  if (receipt) {
    return (
      <ReceiptView
        receipt={receipt}
        form={form}
        customer={form.company || form.fullName || user.fullName}
      />
    );
  }

  return (
    <div ref={topRef} className="@container mx-auto w-full max-w-lg scroll-mt-4">
      <Stepper step={step} onBack={() => go((step - 1) as Step)} />

      <form noValidate onSubmit={(e) => void pay(e)} className="mt-6">
        {step === 0 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[26px] italic leading-tight">
                Choisissez votre forfait
              </h2>
              <CycleSwitch cycle={cycle} onChange={setCycle} badge={annualBadge} />
            </div>
            {planMode === "plans" ? (
              <PlanPicker cycle={cycle} selected={planId} onSelect={setPlanId} />
            ) : (
              <CustomPlanBuilder
                selection={selection}
                onChange={setSelection}
                onPickPlan={(id) => {
                  setPlanId(id);
                  setPlanMode("plans");
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setPlanMode((m) => (m === "plans" ? "custom" : "plans"))}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              {planMode === "plans" ? "Composer un forfait sur mesure" : "Revenir aux forfaits"}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-7 animate-in fade-in duration-200">
            <Group title="Paiement">
              <PaymentMethodFields bind={bind} />
            </Group>
            <Group title="Facturation">
              <BillingFields {...bind} />
            </Group>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in duration-200">
            <ConfirmStep
              draft={draft}
              planLabel={planLabel}
              bind={bind}
              phase={phase}
              transferReference={transferReference}
              onEditPlan={() => go(0)}
              onEditDetails={() => go(1)}
            />
          </div>
        )}

        {step < 2 && (
          <div className="sticky bottom-0 z-10 -mx-4 mt-8 bg-background/90 px-4 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <Button
              type="button"
              size="lg"
              disabled={step === 1 && !detailsValid}
              onClick={() => go((step + 1) as Step)}
              className="h-12 w-full text-[15px] font-semibold"
            >
              Continuer
            </Button>
          </div>
        )}
      </form>

      <div className="mt-10">
        <MoreInfo
          basePrice={cycle === "annual" ? plan.annualMonthly : plan.monthlyPrice}
          planName={planMode === "plans" ? plan.name : "Sur mesure"}
        />
      </div>
    </div>
  );
}
