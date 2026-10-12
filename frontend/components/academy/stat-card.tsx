//frontend\components\academy\stat-card.tsx
"use client";

/**
 * Stat Card — carte de statistique compacte.
 *
 * Utilisée dans le profil apprenant pour afficher XP, streak, cœurs,
 * concepts maîtrisés, etc.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warning";
  className?: string;
};

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "border-border bg-background",
  primary: "border-primary/25 bg-primary/[0.04]",
  success: "border-success/30 bg-success/[0.05]",
  warning: "border-warning/30 bg-warning/[0.05]",
};

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-3 md:p-4",
        TONE_STYLES[tone],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="shrink-0">{icon}</span>
      </div>
      <p className="font-display text-2xl tabular-nums md:text-3xl">{value}</p>
      {hint ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}