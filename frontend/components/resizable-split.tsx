//frontend\components\resizable-split.tsx
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ResizableSplitProps = {
  left: ReactNode;
  right: ReactNode;

  defaultLeftWidth?: number;

  minLeftWidth?: number;

  maxLeftWidth?: number;

  minRightWidth?: number;

  desktopHeight?: number;

  mobileLeftHeight?: number;

  mobileRightHeight?: number;

  resizerLabel?: string;
  className?: string;
};

const RESIZER_W = 8;

export function ResizableSplit({
  left,
  right,
  defaultLeftWidth = 340,
  minLeftWidth = 220,
  maxLeftWidth = 520,
  minRightWidth = 260,
  desktopHeight = 560,
  mobileLeftHeight = 420,
  mobileRightHeight = 460,
  resizerLabel = "Redimensionner le panneau",
  className,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerWidth) return;
    const budget = containerWidth - RESIZER_W - minRightWidth;
    if (budget <= 0) return;
    const maxL = Math.min(maxLeftWidth, Math.max(minLeftWidth, budget));
    setLeftWidth((prev) => Math.min(prev, maxL));
  }, [containerWidth, minLeftWidth, maxLeftWidth, minRightWidth]);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startLeft = leftWidth;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;
      const budget = containerWidth - RESIZER_W - minRightWidth;
      const upper = Math.min(maxLeftWidth, Math.max(minLeftWidth, budget));
      const next = Math.min(upper, Math.max(minLeftWidth, startLeft + delta));
      setLeftWidth(next);
    };
    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-3 md:flex-row md:gap-0 md:overflow-hidden", className)}
      style={{
        ["--rs-lw" as string]: `${leftWidth}px`,
        ["--rs-dh" as string]: `${desktopHeight}px`,
        ["--rs-mlh" as string]: `${mobileLeftHeight}px`,
        ["--rs-mrh" as string]: `${mobileRightHeight}px`,
      }}
    >
      <section
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm",
          "h-[var(--rs-mlh)]",
          "md:h-[var(--rs-dh)] md:shrink-0 md:w-[var(--rs-lw)]",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">{left}</div>
      </section>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={resizerLabel}
        onPointerDown={startResize}
        onDoubleClick={() => setLeftWidth(defaultLeftWidth)}
        title="Glisser pour redimensionner · double-clic pour réinitialiser"
        className="group relative z-10 hidden w-2 shrink-0 cursor-ew-resize md:block"
      >
        <span className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-border/70 transition-colors group-hover:bg-primary" />
      </div>

      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm",
          "h-[var(--rs-mrh)]",
          "md:h-[var(--rs-dh)]",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">{right}</div>
      </section>
    </div>
  );
}
