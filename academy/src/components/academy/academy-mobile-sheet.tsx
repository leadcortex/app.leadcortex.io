//academy\src\components\academy\academy-mobile-sheet.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

/* ==========================================================================
   Hook : détection mobile (self-contained, l'Academy n'a pas accès au
   hook du frontend principal).
   ========================================================================== */

const MOBILE_BREAKPOINT = 768;

export function useIsMobileAcademy(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/* ==========================================================================
   Body scroll lock (compteur partagé)
   ========================================================================== */

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

/* ==========================================================================
   Suivi du clavier virtuel iOS via visualViewport
   → expose --academy-msheet-kb (px) consommée par le CSS du panel
   ========================================================================== */

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
      document.documentElement.style.setProperty(
        "--academy-msheet-kb",
        `${Math.round(kb)}px`,
      );
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--academy-msheet-kb");
    };
  }, [active]);
}

/* ==========================================================================
   Composant
   ========================================================================== */

export type AcademyMobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Si fourni, affiche une flèche retour à gauche (et la croix à droite). */
  onBack?: () => void;
  /** Bouton optionnel à droite du header (icône seule, size 36). */
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  /** `true` = hauteur max 80dvh au lieu de 92dvh (sheets courts). */
  compact?: boolean;
};

export function AcademyMobileSheet({
  open,
  onOpenChange,
  title,
  onBack,
  headerAction,
  children,
  className,
  compact = false,
}: AcademyMobileSheetProps) {
  const isMobile = useIsMobileAcademy();

  /* Body scroll lock */
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  /* Clavier virtuel (uniquement sur mobile, sheet ouverte) */
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
    /* Re-scope Academy pour hériter des vars CSS (--academy-gold, --r-xl, etc.) */
    <div className="academy-scope">
      <div
        className="academy-mobile-sheet-root"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="academy-mobile-sheet-backdrop"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />

        <div
          className={`academy-mobile-sheet-panel${
            compact ? " academy-mobile-sheet-panel--compact" : ""
          }${className ? ` ${className}` : ""}`}
        >
          <span className="academy-mobile-sheet-handle" aria-hidden="true" />

          <header className="academy-mobile-sheet-header">
            {showBackOnLeft ? (
              <button
                type="button"
                className="academy-mobile-sheet-iconbtn"
                aria-label="Retour"
                onClick={onBack}
              >
                <ArrowLeft strokeWidth={2.25} />
              </button>
            ) : (
              <span className="academy-mobile-sheet-placeholder" aria-hidden="true" />
            )}

            <h2>{title}</h2>

            {showBackOnLeft ? (
              <button
                type="button"
                className="academy-mobile-sheet-iconbtn"
                aria-label="Fermer"
                onClick={() => onOpenChange(false)}
              >
                <X strokeWidth={2.25} />
              </button>
            ) : headerAction ? (
              <div className="academy-mobile-sheet-placeholder">{headerAction}</div>
            ) : (
              <button
                type="button"
                className="academy-mobile-sheet-iconbtn"
                aria-label="Fermer"
                onClick={() => onOpenChange(false)}
              >
                <X strokeWidth={2.25} />
              </button>
            )}
          </header>

          <div className="academy-mobile-sheet-body">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}