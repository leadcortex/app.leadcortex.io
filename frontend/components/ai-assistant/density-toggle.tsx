// frontend/components/ai-assistant/density-toggle.tsx

"use client";

import { Rows3, Rows4 } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ChatDensity = "comfortable" | "compact";

const STORAGE_KEY = "lc.assistant.density";

export function readDensity(): ChatDensity {
  if (typeof window === "undefined") return "comfortable";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function persistDensity(density: ChatDensity): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, density);
  } catch {
  }
}

export function DensityToggle({
  density,
  onChange,
  className,
}: {
  density: ChatDensity;
  onChange: (next: ChatDensity) => void;
  className?: string;
}) {
  const compact = density === "compact";
  const label = compact ? "Affichage confortable" : "Affichage compact";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => onChange(compact ? "comfortable" : "compact")}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground",
            className,
          )}
        >
          {compact ? (
            <Rows3 className="size-4" strokeWidth={1.6} />
          ) : (
            <Rows4 className="size-4" strokeWidth={1.6} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
