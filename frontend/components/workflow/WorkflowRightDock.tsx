// frontend/components/workflow/WorkflowRightDock.tsx

"use client";

import { useState } from "react";
import { Sliders, Sparkles } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { RightPanel } from "./RightPanel";
import { WorkflowChatPanel } from "./WorkflowChatPanel";

export type RightDockTab = "inspector" | "assistant";

const STORAGE_KEY = "workflow:right-dock-tab";

function readTab(): RightDockTab {
  if (typeof window === "undefined") return "inspector";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "assistant" ? "assistant" : "inspector";
  } catch {
    return "inspector";
  }
}

export function WorkflowRightDock({
  collapsed = false,
  onRequestExpand,
  className,
}: {
  collapsed?: boolean;
  onRequestExpand?: () => void;
  className?: string;
}) {
  const [tab, setTab] = useState<RightDockTab>(readTab);
  const showContent = !collapsed;

  const select = (next: RightDockTab) => {
    setTab(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
    }
  };

  const handleTabClick = (next: RightDockTab) => {
    if (!showContent) {
      onRequestExpand?.();
      select(next);
      return;
    }
    select(next);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-panel", className)}>
      <div
        role="tablist"
        aria-label="Panneau du canevas"
        className="flex shrink-0 items-stretch border-b border-border"
      >
        <TabButton
          icon={Sliders}
          label="Propriétés"
          active={tab === "inspector"}
          onClick={() => handleTabClick("inspector")}
        />
        <TabButton
          icon={Sparkles}
          label="Assistant IA"
          active={tab === "assistant"}
          onClick={() => handleTabClick("assistant")}
        />
      </div>

      {showContent && (
        <>
          <div
            role="tabpanel"
            aria-label="Propriétés du bloc"
            className={cn(
              "min-h-0 flex-1 overflow-hidden",
              tab !== "inspector" && "hidden",
            )}
          >
            <RightPanel hideHeader />
          </div>
          <div
            role="tabpanel"
            aria-label="Assistant IA du workflow"
            className={cn(
              "min-h-0 flex-1 overflow-hidden",
              tab !== "assistant" && "hidden",
            )}
          >
            <WorkflowChatPanel />
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sliders;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2 : 1.7} />
      <span className="truncate">{label}</span>
      {active && (
        <span className="pointer-events-none absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
