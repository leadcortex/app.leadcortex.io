//frontend\components\mobile\mobile-page-header.tsx
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobilePageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;

  action?: ReactNode;

  actions?: ReactNode;

  sticky?: boolean;
  className?: string;
};

export function MobilePageHeader({
  title,
  subtitle,
  onBack,
  action,
  actions,
  sticky = false,
  className,
}: MobilePageHeaderProps) {
  return (
    <header
      className={cn(
        "min-w-0 bg-background/95 px-4 py-3 backdrop-blur",
        sticky && "sticky top-0 z-20 border-b border-border/60",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className={cn(
              "-ml-2 grid size-11 shrink-0 place-items-center rounded-full",
              "text-foreground transition-colors active:bg-surface",
            )}
          >
            <ArrowLeft className="size-5" strokeWidth={2} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-[13px] leading-tight text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="grid size-11 shrink-0 place-items-center">{action}</div>}
      </div>

      {actions && (
        <div className="mt-3 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide">
          {actions}
        </div>
      )}
    </header>
  );
}
