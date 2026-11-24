// frontend/components/ui/capsule-progress.tsx

import type { CSSProperties } from "react";
import { cn } from "@/lib/core/utils";

export type ProgressCapsuleTone =
  | "primary"
  | "success"
  | "warning"
  | "destructive";

export type ProgressCapsuleProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  tone?: ProgressCapsuleTone;
  fillVar?: string;
  label?: string;
  showValue?: boolean;
  className?: string;
  trailing?: React.ReactNode;
  "aria-label"?: string;
};

const TONE_VAR: Record<ProgressCapsuleTone, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
};

export function ProgressCapsule({
  value,
  max = 100,
  size = "md",
  tone = "primary",
  fillVar,
  label,
  showValue = false,
  trailing,
  className,
  "aria-label": ariaLabel,
}: ProgressCapsuleProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const fillColor = fillVar ?? TONE_VAR[tone];

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue || trailing) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
          {label && <span className="truncate">{label}</span>}
          <span className="ml-auto flex items-center gap-2">
            {showValue && (
              <span className="shrink-0 font-mono tabular-nums">
                {Math.round(pct)}%
              </span>
            )}
            {trailing}
          </span>
        </div>
      )}
      <div
        className={cn(
          "capsule-progress",
          size === "sm" && "capsule-progress--sm",
          size === "md" && "capsule-progress--md",
          size === "lg" && "capsule-progress--lg",
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label}
        style={{ "--capsule-fill": fillColor } as CSSProperties}
      >
        <div className="capsule-progress__track">
          <div
            className="capsule-progress__fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct > 0 && (
          <span
            className="capsule-progress__bead"
            style={{ left: `${pct}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
