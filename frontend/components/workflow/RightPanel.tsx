// frontend/components/workflow/RightPanel.tsx

import { useEffect, useRef, type FocusEvent } from "react";
import { Sliders } from "@/components/icons";
import { useWorkflow } from "@/lib/workflow/store";
import { blockMap, categoryMap } from "@/lib/workflow/geometry";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import { scrollFieldAboveKeyboard } from "@/lib/core/scroll-into-view";
import { NodeSelect } from "./NodeSelect";
import { cn } from "@/lib/core/utils";

function scrollFieldIntoView(e: FocusEvent<HTMLElement>) {
  const el = e.currentTarget;
  window.setTimeout(() => scrollFieldAboveKeyboard(el, ".props-scroll"), 80);
}

function Inspector() {
  const { doc, selection, setDoc } = useWorkflow();
  const node = doc.nodes.find((n) => n.id === selection[0]);
  if (!node)
    return (
      <p className="p-4 text-[13px] text-muted-foreground">
        Sélectionnez un bloc pour le configurer.
      </p>
    );
  const block = blockMap[node.blockId];
  const cat = categoryMap[node.category];

  const set = (key: string, value: string | number | boolean) =>
    setDoc((d) => ({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === node.id ? { ...n, config: { ...n.config, [key]: value } } : n,
      ),
    }));

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: cat.color }} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{node.title}</p>
          <p className="truncate text-xs text-muted-foreground">{cat.label}</p>
        </div>
      </div>
      {block?.configFields.map((f) => {
        const v = node.config[f.key];
        if (f.type === "toggle") {
          return (
            <div key={f.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 text-[13px] font-medium">{f.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(v)}
                  aria-label={f.label}
                  onClick={() => set(f.key, !v)}
                  className={cn(
                    "h-5 w-9 shrink-0 rounded-full transition-colors",
                    v ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className="block size-4 rounded-full bg-background transition-transform"
                    style={{ transform: v ? "translateX(18px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
              {f.help && <span className="block text-xs text-muted-foreground">{f.help}</span>}
            </div>
          );
        }
        return (
          <label key={f.key} className="block space-y-2">
            <span className="block text-[13px] font-medium">{f.label}</span>
            {f.type === "select" ? (
              <NodeSelect
                value={String(v ?? "")}
                onChange={(val) => set(f.key, val)}
                options={f.options ?? []}
                ariaLabel={f.label}
                size="default"
              />
            ) : f.type === "textarea" || f.type === "code" ? (
              <textarea
                value={String(v ?? "")}
                placeholder={f.placeholder ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                onFocus={scrollFieldIntoView}
                rows={3}
                className="w-full resize-y rounded-lg border border-input bg-input-bg px-3 py-2 text-[16px] leading-relaxed outline-none focus:border-ring sm:text-[13px]"
              />
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                value={String(v ?? "")}
                placeholder={f.placeholder ?? ""}
                onChange={(e) =>
                  set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)
                }
                onFocus={scrollFieldIntoView}
                className="h-11 w-full min-w-0 rounded-lg border border-input bg-input-bg px-3 text-[16px] outline-none focus:border-ring sm:h-9 sm:text-[13px]"
              />
            )}
            {f.help && <span className="block text-xs text-muted-foreground">{f.help}</span>}
          </label>
        );
      })}
    </div>
  );
}

export function RightPanel({
  showContent = true,
  onRequestExpand,
  hideHeader = false,
}: {
  showContent?: boolean;
  onRequestExpand?: () => void;
  hideHeader?: boolean;
} = {}) {
  const { inset: keyboardInset } = useVirtualKeyboard();
  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      {!hideHeader && (
        <div className={cn("flex shrink-0", showContent && "border-b border-border")}>
          <button
            type="button"
            onClick={() => {
              if (!showContent) onRequestExpand?.();
            }}
            className="flex h-10 flex-1 items-center justify-center gap-2 text-[13px] font-medium text-foreground"
          >
            <Sliders className="size-4" /> Propriétés
          </button>
        </div>
      )}
      {showContent && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className="props-scroll h-full overflow-y-auto overscroll-none"
            style={{ paddingBottom: keyboardInset ? 96 : 0 }}
          >
            <Inspector />
          </div>
        </div>
      )}
    </div>
  );
}
