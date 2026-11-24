// frontend/components/ai-assistant/prompt-actions.tsx

"use client";

import { Pencil, RotateCcw } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AssistantMessage } from "./assistant-engine";

function IconAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof RotateCcw;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"
        >
          <Icon className="size-3.5" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function PromptActions({
  message,
  onRelaunch,
  onEdit,
  disabled,
  className,
}: {
  message: AssistantMessage;
  onRelaunch: () => void;
  onEdit: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mr-0 flex items-center justify-end gap-0.5",
        "transition-opacity duration-150",
        className,
      )}
    >
      <CopyButton
        text={message.text}
        label="Copier le prompt"
        copiedLabel="Prompt copié"
        size="sm"
      />
      <IconAction
        icon={Pencil}
        label="Modifier et relancer"
        onClick={onEdit}
        disabled={disabled}
      />
      <IconAction
        icon={RotateCcw}
        label="Relancer ce prompt"
        onClick={onRelaunch}
        disabled={disabled}
      />
    </div>
  );
}
