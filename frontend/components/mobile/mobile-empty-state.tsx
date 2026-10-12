//frontend\components\mobile\mobile-empty-state.tsx
//   • icône 48 px (au lieu de 80 px) → ne domine pas l'écran

import type { LucideIcon } from "lucide-react";
import { EmptyState, type EmptyStateProps } from "@/components/empty-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type MobileEmptyStateProps = EmptyStateProps;

export function MobileEmptyState(props: MobileEmptyStateProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return <EmptyState {...props} />;

  const { icon: Icon, title, description, action, actionLabel, onAction, className } = props;

  const resolvedAction =
    action ?? (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/20 px-5 py-8 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" strokeWidth={1.6} />
        </span>
      )}

      <div className="min-w-0 max-w-full space-y-1.5">
        <h3 className="break-words text-[16px] font-semibold leading-tight text-foreground">
          {title}
        </h3>
        {description && (
          <p className="break-words text-[13.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {resolvedAction && (
        <button
          type="button"
          onClick={resolvedAction.onClick}
          className={cn(
            "mt-1 inline-flex h-12 w-full items-center justify-center gap-2",
            "rounded-xl bg-primary px-5 text-[15px] font-medium text-primary-foreground",
            "active:bg-primary/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {resolvedAction.icon && (
            <resolvedAction.icon className="size-4 shrink-0" strokeWidth={2} />
          )}
          <span className="truncate">{resolvedAction.label}</span>
        </button>
      )}
    </div>
  );
}
