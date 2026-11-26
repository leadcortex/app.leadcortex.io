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
  const secondary = summary || description;

  return (
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
        "flex min-h-14 items-center gap-3 px-4 py-3 transition-colors",
        clickable &&
          "cursor-pointer hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />}

      <div className="min-w-0 flex-1">
        {children ?? (
          <>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {secondary && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{secondary}</p>
            )}
          </>
        )}
      </div>

      {actions && <div className="shrink-0">{actions}</div>}

      {clickable && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.8} />
      )}
    </div>
  );
}

export function SectionList({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
      {children}
    </div>
  );
}
