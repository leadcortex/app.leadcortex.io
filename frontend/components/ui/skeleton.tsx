//frontend\components\ui\skeleton.tsx
import { cn } from "@/lib/utils";

type SkeletonVariant = "block" | "text" | "circle" | "button";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  lines?: number;
}

const variantClass: Record<SkeletonVariant, string> = {
  block: "rounded-lg",
  text: "h-3 rounded-full",
  circle: "rounded-full aspect-square",
  button: "h-9 rounded-md",
};

function Skeleton({ className, variant = "block", lines = 1, ...props }: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn("skeleton", variantClass.text, i === lines - 1 ? "w-3/5" : "w-full")}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("skeleton", variantClass[variant], className)}
      {...props}
    />
  );
}

function SkeletonRegion({
  className,
  label = "Chargement du contenu",
  children,
}: {
  className?: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("animate-fade-in", className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export { Skeleton, SkeletonRegion };
