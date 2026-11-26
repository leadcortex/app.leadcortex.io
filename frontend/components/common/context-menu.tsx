// frontend/components/common/context-menu.tsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { clampMenuPosition } from "@/lib/core/viewport-position";

export type ContextMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  shortcut?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  separatorBefore?: boolean;
};

export type ContextMenuSection = {
  id: string;
  label?: string;
  items: ContextMenuItem[];
};

export type ContextMenuProps = {
  open: boolean;
  position: { x: number; y: number };
  sections: ContextMenuSection[];
  onClose: () => void;
  width?: number;
  height?: number;
  title?: string;
};

export function ContextMenu({
  open,
  position,
  sections,
  onClose,
  width = 240,
  title,
}: ContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [finalPosition, setFinalPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setFinalPosition(null);
      return;
    }
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setFinalPosition(clampMenuPosition(position.x, position.y, rect.width, rect.height));
  }, [open, position.x, position.y]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
      first?.focus({ preventScroll: true });
    }, 10);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label={title ?? "Menu contextuel"}
      style={{
        position: "fixed",
        top: finalPosition?.top ?? position.y,
        left: finalPosition?.left ?? position.x,
        width,
        zIndex: 9999,
        visibility: finalPosition ? "visible" : "hidden",
      }}
      className={cn(
        "max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain",
        "rounded-xl border border-border bg-popover p-1",
        "shadow-float",
        "animate-in fade-in-0 zoom-in-95 duration-100",
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {title && (
        <p className="px-2.5 pb-1 pt-1 text-xs font-medium text-muted-foreground">{title}</p>
      )}

      {sections.map((section, si) => {
        if (section.items.length === 0) return null;
        return (
          <div key={section.id} className={cn(si > 0 && "mt-1 border-t border-border/60 pt-1")}>
            {section.label && (
              <p className="px-2.5 pb-1 pt-1 text-xs font-medium text-muted-foreground">
                {section.label}
              </p>
            )}
            {section.items.map((item, ii) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  {item.separatorBefore && ii > 0 && <div className="my-1 h-px bg-border/60" />}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.disabled) return;
                      onClose();
                      requestAnimationFrame(() => item.onSelect());
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      item.disabled
                        ? "cursor-not-allowed opacity-40"
                        : item.tone === "danger"
                          ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                          : "text-foreground hover:bg-secondary/60 focus:bg-secondary/60",
                    )}
                  >
                    {Icon ? (
                      <Icon
                        className={cn(
                          "size-3.5 shrink-0",
                          item.tone === "danger" ? "text-destructive" : "text-muted-foreground",
                        )}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="shrink-0 rounded border border-border bg-surface/60 px-1 py-0.5 font-mono text-[9.5px] text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
