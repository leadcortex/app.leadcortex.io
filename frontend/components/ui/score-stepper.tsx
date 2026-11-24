// frontend/components/ui/score-stepper.tsx

import { Minus, Plus } from "@/components/icons";
import { cn } from "@/lib/core/utils";

export type ScoreStepperProps = {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
};

export function ScoreStepper({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  placeholder = "—",
  className,
  size = "md",
}: ScoreStepperProps) {
  const numeric = value === "" ? null : Number(value);
  const canDecrement = numeric !== null && numeric > min;
  const canIncrement = numeric === null || numeric < max;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const round = (n: number) => Math.round(n * 10) / 10;

  const increment = () => {
    const base = numeric ?? min;
    onChange(String(round(clamp(base + step))));
  };

  const decrement = () => {
    if (numeric === null) return;
    onChange(String(round(clamp(numeric - step))));
  };

  const btnSize = size === "md" ? "size-7" : "size-5";
  const iconSize = size === "md" ? "size-3.5" : "size-2.5";
  const inputWidth = size === "md" ? "flex-1 text-sm" : "w-8 text-xs";

  const btnClass = cn(
    "grid shrink-0 place-items-center rounded-md text-muted-foreground transition-colors",
    "hover:bg-surface hover:text-foreground",
    "active:translate-y-[1px]",
    "disabled:cursor-not-allowed disabled:opacity-30",
    "disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
    btnSize,
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between w-full",
        size === "md"
          ? "h-[38px] rounded-lg border border-border bg-background px-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-[inset_0_1px_0_color-mix(in_oklab,white_35%,transparent)]"
          : "gap-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={!canDecrement}
        aria-label="Diminuer le score"
        title="Diminuer"
        className={btnClass}
      >
        <Minus className={iconSize} strokeWidth={2.5} />
      </button>

      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          const cleaned = raw.replace(",", ".");
          if (!/^\d*\.?\d{0,1}$/.test(cleaned)) return;
          const n = Number(cleaned);
          if (!Number.isFinite(n)) return;
          if (n > max) {
            onChange(String(max));
            return;
          }
          onChange(cleaned);
        }}
        onBlur={(e) => {
          const raw = e.target.value;
          if (raw === "") return;
          const n = Number(raw.replace(",", "."));
          if (Number.isFinite(n)) {
            onChange(String(round(clamp(n))));
          } else {
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label="Score"
        className={cn(
          "bg-transparent text-center font-mono text-foreground tabular-nums focus:outline-none",
          "[appearance:textfield]",
          "[&::-webkit-outer-spin-button]:appearance-none",
          "[&::-webkit-inner-spin-button]:appearance-none",
          inputWidth,
        )}
      />

      <button
        type="button"
        onClick={increment}
        disabled={!canIncrement}
        aria-label="Augmenter le score"
        title="Augmenter"
        className={btnClass}
      >
        <Plus className={iconSize} strokeWidth={2.5} />
      </button>
    </div>
  );
}
