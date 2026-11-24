// frontend/components/ui/stat-tile.tsx

"use client";

import type { LucideIcon, LucideProps } from "@/components/icons";
import { TrendingDown, TrendingUp } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { SmartCounter } from "./animated-counter";

export type StatTileProps = {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  up?: boolean;
  icon?: LucideIcon;
  iconProps?: Omit<LucideProps, "ref">;
  delay?: number;
  className?: string;
};

export function StatTile({
  label,
  value,
  sub,
  delta,
  up,
  icon: Icon,
  iconProps,
  delay = 0,
  className,
}: StatTileProps) {
  return (
    <div className={cn("stat-tile min-w-0", className)}>
      <div className="stat-tile__head">
        <p className="stat-tile__label">{label}</p>
        {Icon && (
          <span className="stat-tile__icon">
            <Icon
              className={iconProps?.className ?? "size-3.5"}
              strokeWidth={iconProps?.strokeWidth ?? 1.8}
              {...iconProps}
            />
          </span>
        )}
      </div>

      <p className="stat-tile__value">
        <SmartCounter text={value} delay={delay} />
      </p>

      {(sub || delta) && (
        <div className="stat-tile__foot">
          {sub ? <span className="stat-tile__sub">{sub}</span> : <span />}
          {delta && (
            <span className={cn("kpi-delta", !up && "kpi-delta--down")}>
              {up ? (
                <TrendingUp className="size-2.5" />
              ) : (
                <TrendingDown className="size-2.5" />
              )}
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
