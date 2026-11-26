// frontend/components/ui/time-picker.tsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "10", "20", "30", "40", "50"];
const ITEM_HEIGHT = 40;
const VISIBLE_HEIGHT = 220;
const PADDING = (VISIBLE_HEIGHT - ITEM_HEIGHT) / 2;

const REPEATED_HOURS = Array.from({ length: 3 }, () => HOURS).flat();
const REPEATED_MINUTES = Array.from({ length: 3 }, () => MINUTES).flat();

export function TimePicker({
  value,
  onChange,
  placeholder = "HH MM",
}: {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(value.split(":")[0] || "09");
  const [m, setM] = useState(value.split(":")[1] || "00");

  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);
  const teleportingRef = useRef(false);

  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v && h && m) onChange(`${h}:${m}`);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      if (hourColRef.current) {
        const idx = Math.max(0, HOURS.indexOf(h));
        hourColRef.current.scrollTop = (idx + HOURS.length) * ITEM_HEIGHT;
      }
      if (minColRef.current) {
        const idx = Math.max(0, MINUTES.indexOf(m));
        minColRef.current.scrollTop = (idx + MINUTES.length) * ITEM_HEIGHT;
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, []);

  const updateDepth = (el: HTMLDivElement) => {
    const center = el.clientHeight / 2;
    const st = el.scrollTop;
    const items = el.children;
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      if (!item.classList.contains("wheel-item")) continue;
      const itemCenter = item.offsetTop + item.offsetHeight / 2 - st;
      const distance = Math.abs(center - itemCenter);
      const ratio = Math.min(1, distance / center);
      item.style.transform = `scale(${1 - ratio * 0.35})`;
      item.style.opacity = `${1 - ratio * 0.75}`;
    }
  };

  const snapToCenter = (type: "h" | "m") => {
    const el = type === "h" ? hourColRef.current : minColRef.current;
    if (!el) return;

    const listLength = type === "h" ? HOURS.length : MINUTES.length;
    const oneRepetition = listLength * ITEM_HEIGHT;

    let targetIdx = Math.round(el.scrollTop / ITEM_HEIGHT);

    if (targetIdx < listLength) {
      targetIdx += listLength;
      el.scrollTop = targetIdx * ITEM_HEIGHT;
    } else if (targetIdx >= listLength * 2) {
      targetIdx -= listLength;
      el.scrollTop = targetIdx * ITEM_HEIGHT;
    }

    const target = targetIdx * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  const handleScroll = (type: "h" | "m") => {
    const el = type === "h" ? hourColRef.current : minColRef.current;
    if (!el || teleportingRef.current) return;

    requestAnimationFrame(() => updateDepth(el));

    const list = type === "h" ? HOURS : MINUTES;
    const listLength = list.length;
    const rawIndex = Math.round(el.scrollTop / ITEM_HEIGHT);
    const actual = ((rawIndex % listLength) + listLength) % listLength;

    if (list[actual]) {
      if (type === "h" && list[actual] !== h) setH(list[actual]);
      if (type === "m" && list[actual] !== m) setM(list[actual]);
    }

    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(() => {
      snapToCenter(type);
    }, 120);
  };

  const jumpTo = (type: "h" | "m", indexInOriginalList: number) => {
    const el = type === "h" ? hourColRef.current : minColRef.current;
    if (!el) return;
    teleportingRef.current = true;
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);

    const listLength = type === "h" ? HOURS.length : MINUTES.length;
    const target = (indexInOriginalList + listLength) * ITEM_HEIGHT;

    el.scrollTo({ top: target, behavior: "smooth" });

    setTimeout(() => {
      updateDepth(el);
      teleportingRef.current = false;
    }, 350);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm shadow-[0_2px_0_var(--border)] transition-all active:translate-y-[2px] active:shadow-none",
            !value && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Clock className="size-4 text-primary shrink-0" />
            <span className="truncate text-sm">
              {value ? value.replace(":", " : ") : placeholder}
            </span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0 rounded-xl border-2 border-border shadow-xl overflow-hidden"
        align="start"
        collisionPadding={12}
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div
          className="relative bg-background flex divide-x divide-border"
          style={{ height: VISIBLE_HEIGHT }}
        >
          <div
            className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 bg-primary/[0.06] border-y border-primary/20 z-0"
            style={{ height: ITEM_HEIGHT }}
          />

          <div
            ref={hourColRef}
            onScroll={() => handleScroll("h")}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 overscroll-contain"
            style={{ touchAction: "pan-y", scrollBehavior: "auto" }}
          >
            <div style={{ height: PADDING }} aria-hidden />
            {REPEATED_HOURS.map((hour, i) => {
              const originalIdx = i % HOURS.length;
              return (
                <div
                  key={`h-${i}`}
                  onClick={() => jumpTo("h", originalIdx)}
                  className="wheel-item flex items-center justify-center font-mono text-lg select-none cursor-pointer"
                  style={{
                    height: ITEM_HEIGHT,
                    transition: "transform 80ms ease-out, opacity 80ms ease-out",
                    willChange: "transform, opacity",
                  }}
                >
                  {hour}
                </div>
              );
            })}
            <div style={{ height: PADDING }} aria-hidden />
          </div>

          <div
            ref={minColRef}
            onScroll={() => handleScroll("m")}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 overscroll-contain"
            style={{ touchAction: "pan-y", scrollBehavior: "auto" }}
          >
            <div style={{ height: PADDING }} aria-hidden />
            {REPEATED_MINUTES.map((minute, i) => {
              const originalIdx = i % MINUTES.length;
              return (
                <div
                  key={`m-${i}`}
                  onClick={() => jumpTo("m", originalIdx)}
                  className="wheel-item flex items-center justify-center font-mono text-lg select-none cursor-pointer"
                  style={{
                    height: ITEM_HEIGHT,
                    transition: "transform 80ms ease-out, opacity 80ms ease-out",
                    willChange: "transform, opacity",
                  }}
                >
                  {minute}
                </div>
              );
            })}
            <div style={{ height: PADDING }} aria-hidden />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
