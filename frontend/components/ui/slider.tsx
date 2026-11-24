// frontend/components/ui/slider.tsx

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/core/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative h-2.5 w-full grow overflow-hidden rounded-full",
        "bg-[var(--track,color-mix(in_oklab,var(--foreground)_7%,transparent))]",
        "shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--foreground)_10%,transparent)]",
      )}
    >
      <SliderPrimitive.Range
        className="absolute h-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in oklab, var(--primary) 78%, transparent), var(--primary))",
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block size-5 rounded-full border-0 bg-background",
        "shadow-[0_0_0_2px_color-mix(in_oklab,var(--primary)_60%,transparent),0_0_10px_color-mix(in_oklab,var(--primary)_40%,transparent)]",
        "transition-[box-shadow,transform] duration-150",
        "hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_50%,transparent),0_0_14px_color-mix(in_oklab,var(--primary)_55%,transparent)]",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_55%,transparent),0_0_14px_color-mix(in_oklab,var(--primary)_60%,transparent)]",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-[3px] rounded-full bg-primary"
      />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
