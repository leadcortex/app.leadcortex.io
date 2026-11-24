// frontend/components/payment/custom-plan-builder.tsx

import {
  Bot,
  Cpu,
  GraduationCap,
  Key,
  Layers,
  LifeBuoy,
  MessageCircle,
  Radar,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "@/components/icons";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/core/utils";
import {
  CUSTOM_BASE,
  CUSTOM_GROUPS,
  CUSTOM_MODULES,
  chosenOption,
  cheapestCoveringPlan,
  customMonthlyPrice,
  defaultSelection,
  paidModules,
  type CustomModule,
  type CustomModuleId,
  type CustomSelection,
} from "@/lib/data/custom-plan";
import type { PlanId } from "@/lib/data/pricing-strategy";
import { eur } from "@/lib/payment/order";

type Props = {
  selection: CustomSelection;
  onChange: (next: CustomSelection) => void;
  onPickPlan: (id: PlanId) => void;
};

const ICONS: Record<CustomModuleId, LucideIcon> = {
  credits: Zap,
  signals: Radar,
  sequences: Send,
  messaging: MessageCircle,
  tokens: Cpu,
  sessions: Bot,
  workflow: Workflow,
  seats: Users,
  workspaces: Layers,
  api: Key,
  support: LifeBuoy,
  academy: GraduationCap,
};

const SEGMENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function PriceTag({ price, label }: { price: number; label: string }) {
  if (price === 0) {
    const none = label === "Non" || label === "0";
    return <span className="text-[11px] text-muted-foreground">{none ? "—" : "Inclus"}</span>;
  }
  return <span className="text-sm font-bold tabular-nums text-foreground">+ {eur(price)}</span>;
}

function ModuleRow({
  mod,
  index,
  onPick,
}: {
  mod: CustomModule;
  index: number;
  onPick: (i: number) => void;
}) {
  const Icon = ICONS[mod.id];
  const opt = mod.options[index] ?? mod.options[0]!;
  return (
    <li
      className={cn(
        "rounded-2xl border p-3.5 transition-all duration-300 md:p-4",
        opt.price > 0
          ? "border-primary/30 bg-background shadow-[var(--shadow-card)]"
          : "border-transparent bg-surface/50",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
            opt.price > 0 ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                "text-sm transition-all",
                opt.price > 0 ? "font-bold" : "font-medium text-muted-foreground",
              )}
            >
              {mod.label}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <PriceTag price={opt.price} label={opt.label} />
              {mod.kind === "toggle" && (
                <Switch
                  checked={index === 1}
                  onCheckedChange={(v) => onPick(v ? 1 : 0)}
                  aria-label={mod.label}
                />
              )}
            </div>
          </div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{mod.hint}</p>

          {mod.kind === "steps" && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {mod.options.map((o, i) => (
                <button
                  key={`${mod.id}-${o.value}`}
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => onPick(i)}
                  className={cn(
                    "h-8 min-w-11 rounded-lg px-3 text-xs tabular-nums transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    i === index
                      ? "bg-foreground font-bold text-background shadow-sm"
                      : "bg-background text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:text-foreground hover:shadow-[inset_0_0_0_1px_var(--input)]",
                  )}
                >
                  {o.label}
                </button>
              ))}
              {mod.unit && (
                <span className="ml-1 text-[11px] text-muted-foreground">{mod.unit}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function CompositionBar({ selection }: { selection: CustomSelection }) {
  const paid = paidModules(selection);
  const total = customMonthlyPrice(selection);
  const skipped = CUSTOM_MODULES.filter((m) => !paid.includes(m));

  const segments = [
    { id: "base", label: CUSTOM_BASE.label, price: CUSTOM_BASE.price },
    ...paid.map((m) => ({ id: m.id, label: m.label, price: chosenOption(m, selection).price })),
  ];

  return (
    <div className="rounded-2xl bg-surface/50 p-4 md:p-5">
      <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <span
            key={s.id}
            title={`${s.label} · ${eur(s.price)}`}
            className="h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: `${(s.price / total) * 100}%`,
              background:
                i === 0 ? "var(--foreground)" : SEGMENT_COLORS[(i - 1) % SEGMENT_COLORS.length],
              opacity: i === 0 ? 0.8 : 1,
            }}
          />
        ))}
      </div>

      <p className="mt-3.5 text-sm">
        Vous payez <strong className="text-xl font-extrabold tabular-nums">{paid.length}</strong>{" "}
        option{paid.length > 1 ? "s" : ""} sur {CUSTOM_MODULES.length}
        {skipped.length > 0 && (
          <>
            {" "}
            · <span className="text-muted-foreground">{skipped.length} que vous ne payez pas</span>
          </>
        )}
        .
      </p>
      {skipped.length > 0 && (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground/80">
          {skipped.slice(0, 5).map((m, i) => (
            <span key={m.id}>
              {i > 0 && " · "}
              <span className="line-through decoration-muted-foreground/40">{m.label}</span>
            </span>
          ))}
          {skipped.length > 5 && ` · +${skipped.length - 5}`}
        </p>
      )}
    </div>
  );
}

export function CustomPlanBuilder({ selection, onChange, onPickPlan }: Props) {
  const total = customMonthlyPrice(selection);
  const covering = cheapestCoveringPlan(selection);
  const betterPlan = covering && covering.monthlyPrice < total ? covering : null;

  const set = (id: CustomModuleId, i: number) => onChange({ ...selection, [id]: i });
  const isDefault = CUSTOM_MODULES.every((m) => selection[m.id] === defaultSelection()[m.id]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              Sur mesure
            </p>
            <h3 className="mt-1 font-display text-[28px] italic leading-tight md:text-[32px]">
              Payez ce que vous utilisez, rien de plus.
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onChange(defaultSelection())}
            disabled={isDefault}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" /> Réinitialiser
          </button>
        </div>
      </div>

      <CompositionBar selection={selection} />

      {betterPlan && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <p className="flex items-start gap-2 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-success" />
            <span>
              Le forfait <strong>{betterPlan.name}</strong> couvre déjà toute votre sélection pour{" "}
              <strong className="tabular-nums">{eur(betterPlan.monthlyPrice)}</strong>, soit{" "}
              <strong className="tabular-nums">{eur(total - betterPlan.monthlyPrice)}</strong> de
              moins.
            </span>
          </p>
          <button
            type="button"
            onClick={() => onPickPlan(betterPlan.id)}
            className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-border transition hover:ring-primary/40"
          >
            Voir {betterPlan.name}
          </button>
        </div>
      )}

      <div className="space-y-7">
        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{CUSTOM_BASE.label}</p>
            <p className="text-[11.5px] text-muted-foreground">{CUSTOM_BASE.detail}</p>
          </div>
          <span className="text-sm font-bold tabular-nums">{eur(CUSTOM_BASE.price)}</span>
        </div>

        {CUSTOM_GROUPS.map((g) => {
          const mods = CUSTOM_MODULES.filter((m) => m.group === g.id);
          return (
            <section key={g.id}>
              <h4 className="mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {g.label}
              </h4>
              <ul className="space-y-2">
                {mods.map((m) => (
                  <ModuleRow
                    key={m.id}
                    mod={m}
                    index={selection[m.id]}
                    onPick={(i) => set(m.id, i)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
