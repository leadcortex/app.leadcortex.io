// frontend/components/ai-assistant/prompt-rail.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/core/utils";
import type { AssistantMessage } from "./assistant-engine";

type PromptTick = { id: string; preview: string };

export function PromptRail({
  messages,
  scrollRef,
  onJump,
}: {
  messages: AssistantMessage[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onJump: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const hoverTimer = useRef<number | null>(null);

  const prompts = useMemo<PromptTick[]>(
    () =>
      messages
        .filter((m) => m.role === "user" && m.text.trim().length > 0)
        .map((m) => ({
          id: m.id,
          preview: m.text.replace(/\s+/g, " ").trim().slice(0, 80),
        })),
    [messages],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const compute = () => {
      setVisible(prompts.length >= 2 && el.scrollHeight > el.clientHeight + 8);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    const mo = new MutationObserver(compute);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [scrollRef, prompts.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const compute = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const zone = scrollRef.current;
        if (!zone) return;
        const zoneRect = zone.getBoundingClientRect();
        const mid = zoneRect.top + zoneRect.height / 2;
        let bestId: string | null = null;
        let bestDist = Infinity;
        for (const p of prompts) {
          const node = zone.querySelector<HTMLElement>(`[data-message-id="${p.id}"]`);
          if (!node) continue;
          const r = node.getBoundingClientRect();
          const cy = r.top + r.height / 2;
          const d = Math.abs(cy - mid);
          if (d < bestDist) {
            bestDist = d;
            bestId = p.id;
          }
        }
        setActiveId(bestId);
      });
    };
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", compute);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollRef, prompts]);

  const openSoon = () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHovered(true), 120);
  };
  const closeSoon = () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHovered(false), 180);
  };

  useEffect(
    () => () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    },
    [],
  );

  if (!visible) return null;

  return (
    <div
      role="navigation"
      aria-label="Navigation rapide dans vos prompts"
      className="pointer-events-none absolute right-1 top-1/2 z-10 -translate-y-1/2"
      onMouseEnter={openSoon}
      onMouseLeave={closeSoon}
    >
      <div className="pointer-events-auto flex max-h-[60vh] flex-col items-end gap-1 overflow-y-auto scrollbar-none py-1">
        {prompts.map((p) => {
          const isActive = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onJump(p.id)}
              aria-label={`Aller au prompt : ${p.preview.slice(0, 40)}`}
              className={cn(
                "block h-[3px] shrink-0 rounded-full transition-all duration-150",
                isActive
                  ? "w-4 bg-primary"
                  : "w-2 bg-muted-foreground/40 hover:w-3 hover:bg-muted-foreground/70",
              )}
            />
          );
        })}
      </div>

      {hovered && (
        <div
          className="pointer-events-auto absolute right-full top-1/2 mr-2 w-[280px] max-w-[80vw] -translate-y-1/2 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in-0 slide-in-from-right-2 duration-150"
          onMouseEnter={openSoon}
          onMouseLeave={closeSoon}
        >
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Vos prompts · {prompts.length}
          </p>
          <ul className="max-h-[55vh] overflow-y-auto overscroll-contain scrollbar-none">
            {prompts.map((p, i) => {
              const isActive = activeId === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onJump(p.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] transition-colors",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 line-clamp-2">
                      {p.preview || "(vide)"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
