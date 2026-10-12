//frontend\components\mobile\mobile-list-row.tsx
import { useRef, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileListRowProps = {
  leading?: ReactNode;

  title: string;

  subtitle?: string;

  meta?: string;

  trailing?: ReactNode;

  showChevron?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
};

export function MobileListRow({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  showChevron,
  onClick,
  onLongPress,
  selected = false,
  disabled = false,
  destructive = false,
  className,
}: MobileListRowProps) {
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  const interactive = !!onClick || !!onLongPress;

  const clearTimer = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!onLongPress) return;
    longPressFired.current = false;
    clearTimer();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      if (navigator.vibrate) navigator.vibrate(12);
      onLongPress();
    }, 480);
  };

  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onClick?.();
  };

  const resolvedChevron = showChevron ?? (!!onClick && !trailing);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearTimer}
      onTouchMove={clearTimer}
      onTouchCancel={clearTimer}
      onClick={disabled ? undefined : handleClick}
      onKeyDown={(e) => {
        if (disabled || !onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex min-h-[56px] w-full min-w-0 items-center gap-3 overflow-hidden px-4 py-2.5",
        "border-b border-border/60 bg-background text-left transition-colors",
        interactive && !disabled && "active:bg-surface/60 cursor-pointer",
        selected && "bg-primary/[0.06]",
        destructive && "text-destructive",
        disabled && "opacity-40 pointer-events-none",
        "focus-visible:outline-none focus-visible:bg-surface/60",
        className,
      )}
    >
      {leading && <span className="grid shrink-0 place-items-center">{leading}</span>}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[15px] font-medium leading-tight",
              destructive ? "text-destructive" : "text-foreground",
            )}
          >
            {title}
          </span>
          {meta && (
            <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">{meta}</span>
          )}
        </span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[13px] leading-tight text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>

      {trailing && <span className="ml-1 grid shrink-0 place-items-center">{trailing}</span>}

      {resolvedChevron && (
        <ChevronRight
          className="ml-0.5 size-4 shrink-0 text-muted-foreground/70"
          strokeWidth={1.8}
          aria-hidden
        />
      )}
    </div>
  );
}
