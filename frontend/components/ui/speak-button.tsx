"use client";

/**
 * Bouton haut-parleur — synthèse vocale.
 *
 * L'API `SpeechSynthesis` n'est pas encore branchée : le bouton reste
 * désactivé, avec tooltip explicite. La signature accepte déjà `text`,
 * donc il suffira de remplacer le corps du `onClick` par l'appel à
 * `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`.
 */
import { Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SpeakButton({
  text,
  size = "sm",
  className,
}: {
  text: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const dims = size === "md" ? "size-8" : "size-7";
  const icon = size === "md" ? "size-4" : "size-3.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          onClick={() => toast.info("Relecture audio — bientôt disponible")}
          className={cn(
            "grid place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-secondary/60",
            dims,
            className,
          )}
          data-text-length={text.length}
        >
          <Volume2 className={icon} strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">Relecture audio · bientôt</TooltipContent>
    </Tooltip>
  );
}