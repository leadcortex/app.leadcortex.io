//frontend\components\settings\loading-button.tsx
import { Loader2, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoadingButtonProps = ButtonProps & {
  loading?: boolean;

  loadingText?: string;
  icon?: LucideIcon;
};

export function LoadingButton({
  loading = false,
  loadingText,
  icon: Icon,
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("relative", className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {Icon && <Icon className="size-3.5" />}
          {children}
        </>
      )}
    </Button>
  );
}
