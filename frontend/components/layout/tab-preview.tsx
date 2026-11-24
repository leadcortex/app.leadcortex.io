// frontend/components/layout/tab-preview.tsx

import { useMemo } from "react";
import { Loader2 } from "@/components/icons";
import type { AppTab } from "@/components/layout/app-tabs";
import { CAPTURE_ATTR } from "@/lib/tabs/tab-capture";

type IconType = typeof Loader2;

const CARD_W = 320;

export type TabPreviewSnapshot = { dataUrl: string | null; error: boolean };

export function TabPreviewCard({
  tab,
  rect,
  Icon,
  snapshot,
}: {
  tab: AppTab;
  rect: { top: number; left: number; bottom: number; width: number };
  Icon: IconType;
  snapshot?: TabPreviewSnapshot;
}) {
  const ratio = useMemo(() => {
    const el = document.querySelector<HTMLElement>(`[${CAPTURE_ATTR}]`);
    const r = el && el.clientHeight > 0 ? el.clientWidth / el.clientHeight : 16 / 10;
    return Math.min(Math.max(r, 1.2), 2.2);
  }, []);

  return (
    <div
      role="tooltip"
      style={{
        position: "fixed",
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - CARD_W - 8)),
        width: CARD_W,
      }}
      className="pointer-events-none z-[100] overflow-hidden rounded-xl border border-border bg-background p-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
        <p className="min-w-0 flex-1 truncate text-xs font-medium">{tab.label}</p>
      </div>
      <div
        className="relative mt-2 overflow-hidden rounded-lg border border-border/60 bg-surface/40"
        style={{ aspectRatio: ratio }}
      >
        {snapshot?.dataUrl ? (
          <img
            src={snapshot.dataUrl}
            alt=""
            draggable={false}
            className="size-full object-cover object-top"
          />
        ) : (
          <div className="size-full min-h-32 p-2.5">
            <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
              <span className="size-2 rounded-full bg-red-400/70" />
              <span className="size-2 rounded-full bg-yellow-400/70" />
              <span className="size-2 rounded-full bg-green-400/70" />
              <span className="ml-1 h-1.5 flex-1 rounded-full bg-border/60" />
            </div>
            <div className="mt-2 animate-pulse space-y-1.5">
              <div className="h-2 w-3/5 rounded bg-border/60" />
              <div className="h-2 w-2/5 rounded bg-border/40" />
              <div className="mt-3 flex gap-1.5">
                <div className="h-8 flex-1 rounded bg-border/30" />
                <div className="h-8 flex-1 rounded bg-border/30" />
                <div className="h-8 flex-1 rounded bg-border/30" />
              </div>
              <div className="h-2 w-full rounded bg-border/40" />
              <div className="h-2 w-5/6 rounded bg-border/40" />
              <div className="h-2 w-4/5 rounded bg-border/40" />
            </div>
          </div>
        )}
        {!snapshot?.dataUrl && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm">
            {snapshot?.error ? "Aperçu indisponible" : <Loader2 className="size-3 animate-spin" />}
          </div>
        )}
      </div>
    </div>
  );
}
