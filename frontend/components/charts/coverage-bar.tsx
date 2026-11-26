// frontend/components/charts/coverage-bar.tsx

import type { ReactNode } from "react";
import { cn } from "@/lib/core/utils";
import { ProgressCapsule } from "@/components/ui/capsule-progress";

export type CoverageBarProps = {
  icon?: ReactNode;
  label: string;
  value: number;
  providers?: ReactNode;
  tone?: "primary" | "success" | "warning" | "destructive";
  className?: string;
};

function autoTone(value: number): CoverageBarProps["tone"] {
  if (value >= 85) return "success";
  if (value >= 70) return "primary";
  if (value >= 50) return "warning";
  return "destructive";
}

export function CoverageBar({ icon, label, value, providers, tone, className }: CoverageBarProps) {
  const resolvedTone = tone ?? autoTone(value);
  return (
    <div className={cn("coverage-row", className)}>
      {icon && <span className="coverage-row__icon">{icon}</span>}
      <span className="coverage-row__label">{label}</span>
      <ProgressCapsule value={value} max={100} size="sm" tone={resolvedTone} />
      <span className="coverage-row__value">{Math.round(value)}%</span>
      {providers && <div className="coverage-row__providers">{providers}</div>}
    </div>
  );
}
