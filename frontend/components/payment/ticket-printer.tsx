// frontend/components/payment/ticket-printer.tsx

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";
import { cn } from "@/lib/core/utils";
import { authCode, eur, formatDateFr, formatTimeFr, type Order } from "@/lib/payment/order";

export type PrinterStatus = "idle" | "printing" | "done";

type Props = {
  status: PrinterStatus;
  order: Order | null;
  customer?: string;
  paymentLabel: string;
  onPrinted?: () => void;
  progress?: number;
  className?: string;
};

const PAPER_W = 264;
const TEETH = 22;
const TOOTH = 6;
const FEED_SPEED = 180;

const INK = "oklch(0.22 0.02 70)";
const PAPER = "oklch(0.985 0.008 85)";

const ZIGZAG = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= TEETH; i++) {
    pts.push(`${((i / TEETH) * 100).toFixed(2)}% ${i % 2 ? 0 : TOOTH}px`);
  }
  for (let i = TEETH; i >= 0; i--) {
    pts.push(`${((i / TEETH) * 100).toFixed(2)}% ${i % 2 ? "100%" : `calc(100% - ${TOOTH}px)`}`);
  }
  return `polygon(${pts.join(",")})`;
})();

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    let s = hashString(seed) || 1;
    const rnd = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    const out: { x: number; w: number }[] = [];
    let x = 0;
    let dark = true;
    while (x < 196) {
      const w = 1 + Math.floor(rnd() * 3);
      if (dark) out.push({ x, w });
      x += w;
      dark = !dark;
    }
    return out;
  }, [seed]);

  return (
    <svg viewBox="0 0 196 34" className="h-7 w-full" aria-hidden="true" preserveAspectRatio="none">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={34} fill="currentColor" />
      ))}
    </svg>
  );
}

function Dash() {
  return (
    <div
      aria-hidden="true"
      className="my-2.5 h-px w-full opacity-40"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 4px, transparent 4px 8px)`,
      }}
    />
  );
}

function Receipt({
  order,
  customer,
  paymentLabel,
  stamped,
}: {
  order: Order;
  customer: string;
  paymentLabel: string;
  stamped: boolean;
}) {
  const hasDiscount = order.lines.some((l) => l.kind === "discount");

  return (
    <div
      className="px-5 pb-8 pt-8 font-mono"
      style={{ clipPath: ZIGZAG, background: PAPER, color: INK }}
    >
      <header className="flex flex-col items-center text-center">
        <BrandLogoMark size={30} aria-label="" />
        <p className="mt-2 text-[13px] font-bold tracking-[0.34em]">LEADCORTEX</p>
        <p className="mt-0.5 text-[9px] tracking-[0.16em] opacity-55">app.leadcortex.io</p>
      </header>

      <Dash />

      <p className="text-center text-[10px] font-bold tracking-[0.28em]">REÇU DE PAIEMENT</p>
      <dl className="mt-2.5 space-y-0.5 text-[10px] opacity-70">
        <div className="flex justify-between gap-3">
          <dt>Date</dt>
          <dd className="tabular-nums">
            {formatDateFr(order.issuedAt)} · {formatTimeFr(order.issuedAt)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>N°</dt>
          <dd className="tabular-nums">{order.id}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Client</dt>
          <dd className="truncate">{customer}</dd>
        </div>
      </dl>

      <Dash />

      <ul className="space-y-1.5">
        {order.lines.map((l) => (
          <li key={l.id}>
            <div
              className={cn(
                "flex items-baseline justify-between gap-3 text-[11px]",
                l.kind === "item" ? "font-semibold" : "font-normal opacity-75",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{l.label}</span>
              <span className="shrink-0 tabular-nums">
                {l.amount < 0 ? "−" : ""}
                {eur(Math.abs(l.amount))}
              </span>
            </div>
            {l.detail && <p className="text-[9px] opacity-50">{l.detail}</p>}
          </li>
        ))}
      </ul>

      <Dash />

      <div className="relative">
        {hasDiscount && (
          <p className="mb-1 text-[9px] opacity-55">Remises déjà déduites du total.</p>
        )}
        <div className="flex items-end justify-between gap-2">
          <span className="pb-1 text-[10px] font-bold tracking-[0.22em]">TOTAL TTC</span>
          <span className="text-[27px] font-extrabold leading-none tabular-nums tracking-tight">
            {eur(order.total)}
          </span>
        </div>
        <p className="mt-1 text-right text-[9px] opacity-55">
          dont TVA {Math.round(order.vatRate * 100)} % : {eur(order.vat)}
        </p>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-5 left-1 select-none rounded-sm border-[3px] px-2.5 py-0.5 text-[15px] font-extrabold tracking-[0.2em] mix-blend-multiply transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            color: "oklch(0.55 0.17 30)",
            borderColor: "oklch(0.55 0.17 30)",
            opacity: stamped ? 0.88 : 0,
            transform: `rotate(-11deg) scale(${stamped ? 1 : 1.9})`,
          }}
        >
          PAYÉ
        </span>
      </div>

      <Dash />

      <div className="flex justify-between gap-3 text-[10px] tabular-nums opacity-70">
        <span>{paymentLabel}</span>
        <span>Aut. {authCode(order.id)}</span>
      </div>

      <div className="mt-3">
        <Barcode seed={order.id} />
      </div>

      <div className="mt-3 text-center">
        <p className="text-[11px] font-bold">Merci de votre confiance.</p>
        <p className="mt-1 text-[9px] leading-relaxed opacity-55">
          Prochaine échéance : {order.nextChargeLabel} · Résiliable à tout moment
        </p>
      </div>
    </div>
  );
}

export function TicketPrinter({
  status,
  order,
  customer = "Votre compte",
  paymentLabel,
  onPrinted,
  progress,
  className,
}: Props) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [paperH, setPaperH] = useState(0);
  const [printedH, setPrintedH] = useState(0);
  const onPrintedRef = useRef(onPrinted);
  onPrintedRef.current = onPrinted;

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useLayoutEffect(() => {
    const el = paperRef.current;
    if (!el) {
      setPaperH(0);
      return;
    }
    const measure = () => setPaperH(el.scrollHeight);
    measure();
    const frame = window.requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [order]);

  useEffect(() => {
    if (!order || paperH === 0 || status === "idle") {
      setPrintedH(0);
      return;
    }

    if (status === "done") {
      setPrintedH(paperH);
      return;
    }

    if (progress !== undefined) {
      const ratio = Math.min(1, Math.max(0, progress));
      setPrintedH(ratio * paperH);
      if (ratio >= 1) onPrintedRef.current?.();
      return;
    }

    if (reducedMotion) {
      setPrintedH(paperH);
      onPrintedRef.current?.();
      return;
    }

    setPrintedH(0);
    const duration = Math.min(6500, Math.max(2200, (paperH / FEED_SPEED) * 1000));
    const startAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startAt) / duration));
      setPrintedH(progress * paperH);
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        onPrintedRef.current?.();
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [status, order, paperH, reducedMotion, progress]);

  const printing = status === "printing";
  const done = status === "done";

  const lcdLine1 = done ? "TERMINÉ" : printing ? "IMPRESSION" : order ? "AUTORISATION" : "PRÊT";
  const lcdLine2 = order ? eur(order.total) : "EN ATTENTE";

  return (
    <div className={cn("w-full select-none", className)}>
      <p className="sr-only" role="status" aria-live="polite">
        {done && order ? `Ticket imprimé. Total ${eur(order.total)}.` : ""}
      </p>

      <div
        className="relative z-10 rounded-[26px] px-5 pb-5 pt-6"
        style={{
          background: "linear-gradient(180deg, oklch(0.36 0.02 68) 0%, oklch(0.25 0.02 66) 100%)",
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.16), inset 0 -3px 0 oklch(0 0 0 / 0.35), 0 22px 36px -16px oklch(0.2 0.02 70 / 0.6)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-5 -bottom-2.5 h-5 rounded-full"
          style={{
            background: "linear-gradient(180deg, oklch(0.1 0.01 65), oklch(0.19 0.02 66))",
            boxShadow: "inset 0 -1px 0 oklch(1 0 0 / 0.12), 0 2px 0 oklch(0.34 0.02 68)",
          }}
        />

        <div className="flex items-center gap-3">
          <BrandLogoMark size={20} aria-label="" className="shrink-0 text-white/80" />

          <div
            className="min-w-0 flex-1 rounded-md px-2.5 py-1.5 font-mono"
            style={{
              background: "oklch(0.24 0.045 150)",
              boxShadow: "inset 0 2px 4px oklch(0 0 0 / 0.5), 0 1px 0 oklch(1 0 0 / 0.08)",
              color: "oklch(0.86 0.17 150)",
            }}
          >
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.2em]">
              {lcdLine1}
              {printing && <span className="animate-pulse">…</span>}
            </p>
            <p className="truncate text-[13px] font-bold tabular-nums leading-tight">{lcdLine2}</p>
          </div>

          <span
            aria-hidden="true"
            className={cn("size-2.5 shrink-0 rounded-full", printing && "animate-pulse")}
            style={{
              background: done
                ? "oklch(0.78 0.2 150)"
                : printing
                  ? "oklch(0.8 0.18 150)"
                  : "oklch(0.72 0.14 70)",
              boxShadow: done || printing ? "0 0 10px oklch(0.8 0.2 150 / 0.9)" : "none",
            }}
          />
        </div>

        <div
          aria-hidden="true"
          className="mb-1 mt-4 h-2 rounded-full opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, oklch(0 0 0 / 0.45) 0 2px, transparent 2px 7px)",
          }}
        />
      </div>

      {order && (
        <div
          className="relative z-0 mx-auto overflow-hidden"
          style={{
            width: PAPER_W,
            height: Math.min(printedH, paperH),
            transition:
              progress !== undefined && !reducedMotion ? "height 900ms ease-out" : undefined,
            filter: "drop-shadow(0 6px 10px oklch(0.2 0.02 70 / 0.28))",
          }}
          aria-hidden={false}
        >
          <div ref={paperRef} className="w-full">
            <Receipt order={order} customer={customer} paymentLabel={paymentLabel} stamped={done} />
          </div>
        </div>
      )}
    </div>
  );
}
