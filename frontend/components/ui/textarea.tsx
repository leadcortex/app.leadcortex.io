// frontend/components/ui/textarea.tsx

import * as React from "react";

import { cn } from "@/lib/core/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base",
          "shadow-[inset_0_1px_1px_color-mix(in_oklab,var(--foreground)_3%,transparent)]",
          "transition-[border-color,box-shadow] duration-150",
          "placeholder:text-muted-foreground",
          "hover:border-primary/30",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
