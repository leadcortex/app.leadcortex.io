// frontend/components/ui/transparency-grid.tsx

import { cn } from "@/lib/core/utils";

export function TransparencyGrid({ className, size = 12 }: { className?: string; size?: number }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: `
          linear-gradient(45deg, #d4d4d4 25%, transparent 25%),
          linear-gradient(-45deg, #d4d4d4 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #d4d4d4 75%),
          linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)
        `,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `0 0, 0 ${size / 2}px, ${size / 2}px -${size / 2}px, -${size / 2}px 0px`,
      }}
    />
  );
}
