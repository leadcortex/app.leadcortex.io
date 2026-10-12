//frontend\components\mobile\mobile-segmented-control.tsx
// • Ne déborde JAMAIS horizontalement (overflow-x-auto dans un flex min-w-0)

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type MobileSegmentedOption<T extends string> = {
  value: T;
  label: string;

  badge?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type MobileSegmentedControlProps<T extends string> = {
  options: readonly MobileSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;

  autoScroll?: boolean;
};

export function MobileSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  autoScroll = true,
}: MobileSegmentedControlProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<T, HTMLButtonElement | null>>(new Map());

  useEffect(() => {
    if (!autoScroll) return;
    const el = itemRefs.current.get(value);
    if (!el || !scrollerRef.current) return;
    const parent = scrollerRef.current;
    const offset = el.offsetLeft - parent.clientWidth / 2 + el.offsetWidth / 2;
    parent.scrollTo({ left: offset, behavior: "smooth" });
  }, [value, autoScroll]);

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden border-b border-border/60 bg-background",
        className,
      )}
    >
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Sections"
        className={cn(
          "flex min-w-0 items-stretch gap-0 overflow-x-auto overscroll-x-contain scrollbar-hide",
          "snap-x snap-mandatory scroll-px-4 px-1",
        )}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                itemRefs.current.set(opt.value, el);
              }}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative shrink-0 snap-start",
                "inline-flex min-h-[44px] items-center gap-2 px-3.5",
                "text-[14px] font-medium transition-colors",
                "focus-visible:outline-none",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              <span className="max-w-[180px] truncate whitespace-nowrap">{opt.label}</span>
              {opt.badge !== undefined && opt.badge !== "" && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums",
                    active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {opt.badge}
                </span>
              )}

              {}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-primary",
                  "transition-opacity duration-150",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
