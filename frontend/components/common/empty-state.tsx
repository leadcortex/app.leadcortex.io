// frontend/components/common/empty-state.tsx

import { type LucideIcon } from "@/components/icons";
import { cn } from "@/lib/core/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: {
    icon: "w-10 h-10",
    title: "text-lg",
    description: "text-sm",
  },
  md: {
    icon: "w-14 h-14",
    title: "text-2xl",
    description: "text-base",
  },
  lg: {
    icon: "w-20 h-20",
    title: "text-4xl",
    description: "text-lg",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = sizeMap[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-surface/30",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "relative mb-4 grid place-items-center rounded-2xl bg-primary/[0.06] text-primary/70",
            sizes.icon,
          )}
        >
          <Icon className="w-1/2 h-1/2" strokeWidth={1.5} />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
            }}
          />
        </div>
      )}
      <h3 className={cn("font-medium text-foreground", sizes.title)}>{title}</h3>
      {description && (
        <p className={cn("text-muted-foreground mt-2 max-w-md", sizes.description)}>
          {description}
        </p>
      )}
      {!action && actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl btn-tactile"
        >
          {actionLabel}
        </button>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl btn-tactile"
        >
          {action.icon && <action.icon className="size-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
