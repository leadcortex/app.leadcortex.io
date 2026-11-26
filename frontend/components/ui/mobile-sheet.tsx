// frontend/components/ui/mobile-sheet.tsx

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "@/components/icons";
import { cn } from "@/lib/core/utils";
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

export type MobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onBack?: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

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

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useKeyboardOffset(open && isMobile);

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
        className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden",
          "rounded-t-3xl border-x border-t border-border bg-background",
          "shadow-float",
          "animate-in slide-in-from-bottom-full duration-300 ease-out",
          compact ? "max-h-[80dvh]" : "h-[92dvh] max-h-[92dvh]",
          className,
        )}
        style={{
          marginBottom: "var(--msheet-kb, 0px)",
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
          <div className="pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
