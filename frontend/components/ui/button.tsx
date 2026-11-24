// frontend/components/ui/button.tsx

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/core/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer",
    "transition-[transform,box-shadow,background-color,color] duration-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_3px_0_color-mix(in_oklab,var(--primary)_62%,black)] hover:bg-primary/95 active:translate-y-[3px] active:shadow-[0_0_0_transparent]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_3px_0_color-mix(in_oklab,var(--destructive)_62%,black)] hover:bg-destructive/95 active:translate-y-[3px] active:shadow-[0_0_0_transparent]",
        outline:
          "border border-border bg-background shadow-[0_2px_0_var(--border)] hover:bg-surface/60 hover:border-primary/40 active:translate-y-[2px] active:shadow-[0_0_0_transparent]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_2px_0_color-mix(in_oklab,var(--secondary)_70%,black)] hover:bg-secondary/90 active:translate-y-[2px] active:shadow-[0_0_0_transparent]",
        ghost:
          "hover:bg-surface/70 hover:text-foreground active:bg-surface/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
