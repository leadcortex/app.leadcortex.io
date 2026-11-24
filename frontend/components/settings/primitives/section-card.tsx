// frontend/components/settings/primitives/section-card.tsx

import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "@/components/icons";
import { cn } from "@/lib/core/utils";

export type SectionCardProps = {
  title: string;
  description?: string;
  summary?: string;
  icon?: LucideIcon;
  onDrilldown?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  summary,
  icon: Icon,
  onDrilldown,
  actions,
  children,
  className,
}: SectionCardProps) {
  const clickable = typeof onDrilldown === "function";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3 px-1">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
      </div>

      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onDrilldown : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDrilldown?.();
                }
              }
            : undefined
        }
        className={cn(
          "rounded-xl border border-border bg-background transition-all",
          clickable &&
            "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995]",
        )}
      >
        <div className="flex items-center gap-3 p-3.5">
          {Icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4.5" strokeWidth={1.8} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            {children ? (
              children
            ) : (
              <>
                {description && (
                  <p className="text-sm font-medium leading-tight text-foreground">
                    {description}
                  </p>
                )}
                {summary && (
                  <p
                    className={cn(
                      "mt-0.5 text-[11px] leading-tight text-muted-foreground truncate",
                      !description && "mt-0 text-sm font-medium text-foreground",
                    )}
                  >
                    {summary}
                  </p>
                )}
              </>
            )}
          </div>

          {actions && <div className="shrink-0">{actions}</div>}

          {clickable && (
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground/60"
              strokeWidth={1.8}
            />
          )}
        </div>
      </div>
    </div>
  );
}
