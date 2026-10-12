//frontend\components\ui\mobile-sheet.tsx
// • ⭐ Suit le clavier virtuel iOS via visualViewport : la sheet remonte

// • ⭐ Bornage en paysage (max-height: 92dvh, jamais plus que l'écran).

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

let bodyLockCount = 0;
let savedBodyOverflow = "";

function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (bodyLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
  }
}

/*  le haut via margin-bottom: var(--msheet-kb). Utilise visualViewport        */
/*  (iOS Safari 13+, Chrome Android 61+). Fallback silencieux si absent.       */

function useKeyboardOffset(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const layoutHeight = window.innerHeight;
      const visibleBottom = vv.height + vv.offsetTop;
      const kb = Math.max(0, layoutHeight - visibleBottom);
      document.documentElement.style.setProperty("--msheet-kb", `${Math.round(kb)}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--msheet-kb");
    };
  }, [active]);
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type MobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Si fourni, affiche une flèche retour à gauche (et la croix passe à droite). */
  onBack?: () => void;
  /** Bouton optionnel à droite du header (icône seule, size-9). */
  headerAction?: ReactNode;
  /** Contenu scrollable. */
  children: ReactNode;
  /** Classe additionnelle sur le panneau. */
  className?: string;
  /**
   * `true` = la sheet ne peut pas être agrandie au-delà du contenu (fit-content).
   * Utile pour les action sheets courts. Par défaut : `false` (92dvh).
   */
  compact?: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Composant                                                                 */
/* -------------------------------------------------------------------------- */

export function MobileSheet({
  open,
  onOpenChange,
  title,
  onBack,
  headerAction,
  children,
  className,
  compact = false,
}: MobileSheetProps) {
  const isMobile = useIsMobile();

  /* Verrou body (compteur) */
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  /* Suivi clavier virtuel */
  useKeyboardOffset(open && isMobile);

  /* Esc ferme */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !isMobile || typeof document === "undefined") return null;

  const showBackOnLeft = typeof onBack === "function";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex flex-col justify-end"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden",
          "rounded-t-3xl border-x border-t border-border bg-background",
          "shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.35)]",
          "animate-in slide-in-from-bottom-full duration-300 ease-out",
          compact ? "max-h-[80dvh]" : "h-[92dvh] max-h-[92dvh]",
          className,
        )}
        style={{
          // Remonte la sheet au-dessus du clavier virtuel iOS.
          marginBottom: "var(--msheet-kb, 0px)",
          // Garantit qu'on ne dépasse jamais la hauteur visible réelle.
          maxHeight: "min(92dvh, calc(100dvh - var(--msheet-kb, 0px)))",
          transition: "margin-bottom 180ms ease-out",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-border"
        />

        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-2 pb-2.5 pt-5">
          <div className="grid size-9 shrink-0 place-items-center">
            {showBackOnLeft ? (
              <button
                type="button"
                aria-label="Retour"
                onClick={onBack}
                className="grid size-9 place-items-center rounded-full bg-surface/70 text-foreground transition-colors active:bg-surface"
              >
                <ArrowLeft className="size-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => onOpenChange(false)}
                className="grid size-9 place-items-center rounded-full bg-surface/70 text-foreground transition-colors active:bg-surface"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            )}
          </div>

          <h2 className="min-w-0 flex-1 truncate text-center text-base font-semibold">{title}</h2>

          <div className="grid size-9 shrink-0 place-items-center">
            {showBackOnLeft ? (
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => onOpenChange(false)}
                className="grid size-9 place-items-center rounded-full bg-surface/70 text-foreground transition-colors active:bg-surface"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            ) : (
              headerAction
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide">
          <div
            className="pb-[max(1rem,env(safe-area-inset-bottom))]"
            // Le padding-bottom réserve la safe area iOS même quand la sheet
            // est scrollée jusqu'en bas. Combiné au marginBottom clavier plus
            // haut, le résultat est robuste dans tous les cas.
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
