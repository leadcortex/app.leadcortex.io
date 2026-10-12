//frontend\components\mobile\mobile-sticky-bar.tsx
//     MobileBottomNav) → jamais masqué.

// contenu scrollable ne soit jamais caché derrière la barre : pour cela,

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileStickyAction = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;

  variant?: "primary" | "secondary" | "destructive";

  loading?: boolean;
};

export type MobileStickyBarProps = {
  actions: MobileStickyAction[];

  hint?: ReactNode;
  className?: string;
};

export function MobileStickyBar({ actions, hint, className }: MobileStickyBarProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur",
        className,
      )}
      style={{
        bottom: "calc(var(--pen-nav-h, 0px))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      {hint && (
        <div className="border-b border-border/40 px-4 py-2 text-[12.5px] text-muted-foreground">
          {hint}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 pt-3">
        {actions.map((action, i) => {
          const isSecondary = action.variant === "secondary" && actions.length > 1;
          const isLast = i === actions.length - 1;
          const variant = action.variant ?? "primary";
          const Icon = action.icon;

          return (
            <button
              key={`${action.label}-${i}`}
              type="button"
              disabled={action.disabled || action.loading}
              onClick={action.onClick}
              className={cn(
                "inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-4",
                "text-[15px] font-semibold transition-colors",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                // Bouton secondaire = outline · principal = plein.
                isSecondary
                  ? "shrink-0 border border-border bg-background text-foreground active:bg-surface"
                  : variant === "destructive"
                    ? "flex-1 bg-destructive text-destructive-foreground active:bg-destructive/90"
                    : "flex-1 bg-primary text-primary-foreground active:bg-primary/90",
                // Si pas secondaire et unique : plein largeur.
                !isSecondary && actions.length === 1 && "w-full",
              )}
            >
              {action.loading ? (
                <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                Icon && <Icon className="size-4 shrink-0" strokeWidth={2} />
              )}
              <span className="min-w-0 truncate">{action.label}</span>

              {isLast && null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Espaceur à poser en fin de contenu scrollable pour que la barre ne
 * recouvre jamais le dernier élément.
 *
 *   <div className="space-y-3">
 *     {items.map(...)}
 *     <MobileStickyBar.Spacer />   ← réserve la hauteur de la barre + nav + safe-area
 *   </div>
 */
MobileStickyBar.Spacer = function MobileStickyBarSpacer() {
  return (
    <div
      aria-hidden
      style={{
        height: "calc(4.25rem + var(--pen-nav-h, 0px) + env(safe-area-inset-bottom))",
      }}
    />
  );
};
