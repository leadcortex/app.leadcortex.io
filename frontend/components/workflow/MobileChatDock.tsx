// frontend/components/workflow/MobileChatDock.tsx

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripHorizontal } from "@/components/icons";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import { WorkflowRightDock } from "./WorkflowRightDock";
import { MOBILE_TOOLBAR_HEIGHT } from "./BottomToolbar";
import { MOBILE_TOP_BAR_HEIGHT } from "./MobileTopBar";
import { TERMINAL_COLLAPSED_HEIGHT } from "./Terminal";

export const DOCK_COLLAPSED_HEIGHT = 68;

const EXPANDED_RATIO = 0.82;

const TOP_SAFE_MARGIN = 12;

const RESERVED_ABOVE =
  MOBILE_TOP_BAR_HEIGHT + MOBILE_TOOLBAR_HEIGHT + TERMINAL_COLLAPSED_HEIGHT + TOP_SAFE_MARGIN;

export function MobileChatDock() {
  const [expanded, setExpanded] = useState(false);
  const { inset: keyboardInset, viewportHeight } = useVirtualKeyboard();
  const dockRef = useRef<HTMLDivElement>(null);

  const expandedHeight = Math.max(
    DOCK_COLLAPSED_HEIGHT,
    Math.min(Math.round(viewportHeight * EXPANDED_RATIO), viewportHeight - RESERVED_ABOVE),
  );
  const height = expanded ? expandedHeight : DOCK_COLLAPSED_HEIGHT;

  const collapse = () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && dockRef.current?.contains(active)) active.blur();
    setExpanded(false);
  };

  const toggle = () => (expanded ? collapse() : setExpanded(true));

  return (
    <div
      className="relative shrink-0"
      style={{
        height,
        transition: "height 200ms ease-out",
      }}
    >
      <div
        ref={dockRef}

        className="flex h-full flex-col overflow-hidden overscroll-none border-t border-border bg-panel"
        style={{
          paddingBottom: keyboardInset || !expanded ? 0 : "env(safe-area-inset-bottom)",
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Réduire l'assistant" : "Agrandir l'assistant"}
          className="flex shrink-0 items-center justify-center gap-1.5 py-1.5 text-muted-foreground"
        >
          <GripHorizontal className="h-3.5 w-3.5" />
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
        <div className="min-h-0 flex-1 overflow-hidden overscroll-none">
          <WorkflowRightDock
            collapsed={!expanded}
            onRequestExpand={() => setExpanded(true)}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-panel"
          style={{ height: "env(safe-area-inset-bottom, 0px)" }}
        />
      </div>
    </div>
  );
}
