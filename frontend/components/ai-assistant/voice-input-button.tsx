// frontend/components/ai-assistant/voice-input-button.tsx

"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff } from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VoiceInputButton({
  onTranscribe,
  disabled,
  className,
}: {
  onTranscribe?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [recording, setRecording] = useState(false);

  const handleClick = useCallback(() => {
    if (recording) {
      setRecording(false);
      toast.info("Capture vocale annulée");
      return;
    }
    setRecording(true);
    toast.info("Dictée vocale : bientôt disponible", {
      description: "Elle arrive dans une prochaine version.",
    });
    window.setTimeout(() => {
      setRecording(false);
      void onTranscribe;
    }, 1800);
  }, [recording, onTranscribe]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={recording ? "Arrêter la dictée" : "Dicter un message"}
          title={recording ? "Arrêter la dictée" : "Dicter un message"}
          aria-pressed={recording}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40",
            recording && "border-primary/60 bg-primary/10 text-primary",
            className,
          )}
        >
          {recording ? (
            <MicOff className="size-4" strokeWidth={1.8} />
          ) : (
            <Mic className="size-4" strokeWidth={1.8} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {recording ? "Arrêter la dictée" : "Dicter un message"}
      </TooltipContent>
    </Tooltip>
  );
}
