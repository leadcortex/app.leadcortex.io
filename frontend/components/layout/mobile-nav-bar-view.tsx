// frontend/components/layout/mobile-nav-bar-view.tsx
// Rendu visuel de la barre mobile (bulle ronde + barre), partagé par la vraie barre
// et par l'aperçu modifiable des paramètres : les deux ont exactement le même look.

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/core/utils";

export const NAV_ICON_STYLE: CSSProperties = {
  width: "clamp(20px, 5.5vw, 26px)",
  height: "clamp(20px, 5.5vw, 26px)",
};

export function MobileNavBarView({
  bubble,
  items,
  bubbleLabel = "Section mise en avant",
}: {
  bubble: ReactNode | null;
  items: ReactNode[];
  bubbleLabel?: string;
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      {bubble && (
        <nav
          aria-label={bubbleLabel}
          className={cn(
            "grid size-14 shrink-0 place-items-center overflow-hidden rounded-full",
            "border border-white/15 dark:border-white/10",
            "shadow-[0_2px_10px_rgba(0,0,0,0.10)]",
            "bg-white/15 dark:bg-white/[0.06]",
            "backdrop-blur-2xl",
          )}
        >
          {bubble}
        </nav>
      )}

      <nav
        aria-label="Navigation principale"
        className={cn(
          "grid h-14 flex-1 items-stretch overflow-hidden rounded-2xl",
          "border border-white/15 dark:border-white/10",
          "shadow-[0_2px_10px_rgba(0,0,0,0.10)]",
          "bg-white/[0.12] dark:bg-white/[0.05]",
          "backdrop-blur-2xl",
        )}
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items}
      </nav>
    </div>
  );
}
