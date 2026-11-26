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
        "relative h-2 w-full grow overflow-hidden rounded-full",
        "bg-[var(--track,color-mix(in_oklab,var(--foreground)_7%,transparent))]",
      )}
    >
      <SliderPrimitive.Range
        className="absolute h-full rounded-full"
        style={{
          background: "var(--primary)",
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block size-5 rounded-full border-0 bg-background",
        "shadow-[0_0_0_2px_var(--primary),0_1px_3px_color-mix(in_oklab,var(--foreground)_20%,transparent)]",
        "transition-[box-shadow] duration-150 ease-out",
        "cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--primary),0_0_0_6px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <span aria-hidden className="absolute inset-[3px] rounded-full bg-primary" />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
