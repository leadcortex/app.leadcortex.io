// frontend/components/ai-assistant/assistant-dock-button.tsx

import { useEffect, useRef, useState } from "react";
import { Plus, Tag } from "@/components/icons";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";
import { cn } from "@/lib/core/utils";
import { openAssistant } from "./assistant-bus";
import { setAssistantDocked, useAssistantDocked } from "./assistant-dock";

const HIDE_DELAY_MS = 120;

export function AssistantDockButton() {
  const docked = useAssistantDocked();
  const [showOption, setShowOption] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  useEffect(() => clearHideTimer, []);

  useEffect(() => {
    if (!docked) {
      clearHideTimer();
      setShowOption(false);
    }
  }, [docked]);

  const onEnter = () => {
    clearHideTimer();
    setShowOption(true);
  };

  const onLeave = () => {
    clearHideTimer();
    hideTimer.current = window.setTimeout(() => setShowOption(false), HIDE_DELAY_MS);
  };

  if (!docked) {
    return (
      <button
        type="button"
        aria-label="Ancrer l'assistant IA dans l'en-tête"
        title="Ancrer l'assistant IA ici"
        onClick={() => setAssistantDocked(true)}
        className="rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2"
      >
        <Plus className="size-4 md:size-5" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <div
      className="relative"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={(e) => {
        if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) onEnter();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setShowOption(false);
      }}
    >
      <button
        type="button"
        aria-label="Ouvrir l'assistant IA"
        onClick={() => {
          setShowOption(false);
          openAssistant();
        }}
        className="rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2"
      >
        <span className="relative grid size-4 place-items-center md:size-5">
          <BrandLogoMark size="100%" aria-label="" className="size-full" />
          <span
            aria-hidden
            className="absolute -top-1.5 -right-2 grid size-3.5 place-items-center rounded-full bg-primary text-[7px] leading-none font-bold tracking-tight text-primary-foreground ring-2 ring-background"
          >
            IA
          </span>
        </span>
      </button>

      <div
        className={cn(
          "absolute top-full right-0 z-50 pt-1 transition-opacity duration-150",
          showOption ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          tabIndex={showOption ? 0 : -1}
          onClick={() => {
            setShowOption(false);
            setAssistantDocked(false);
          }}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg transition-colors hover:bg-secondary/60"
        >
          <Tag className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
          Remettre l'étiquette
        </button>
      </div>
    </div>
  );
}
