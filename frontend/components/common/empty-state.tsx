// frontend/components/common/empty-state.tsx

import { type LucideIcon } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { buttonVariants } from "@/components/ui/button";

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
    icon: "size-10",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    icon: "size-12",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    icon: "size-14",
    title: "text-xl",
    description: "text-base",
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
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mb-4 grid place-items-center rounded-xl bg-secondary text-muted-foreground",
            sizes.icon,
          )}
        >
          <Icon className="w-1/2 h-1/2" strokeWidth={1.5} />
        </div>
      )}
      <h3 className={cn("font-semibold text-foreground", sizes.title)}>{title}</h3>
      {description && (
        <p className={cn("text-muted-foreground mt-1 max-w-md", sizes.description)}>
          {description}
        </p>
      )}
      {!action && actionLabel && onAction && (
        <button onClick={onAction} className={cn(buttonVariants(), "mt-6")}>
          {actionLabel}
        </button>
      )}
      {action && (
        <button onClick={action.onClick} className={cn(buttonVariants(), "mt-6")}>
          {action.icon && <action.icon className="size-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
