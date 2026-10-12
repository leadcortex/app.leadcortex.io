"use client";

/**
 * Bouton d'envoi vocal.
 *
 * **Placeholder assumé** : la capture audio complète (MediaRecorder +
 * transcription serveur) demande un backend dédié qu'on n'a pas encore.
 * Pour l'instant, le bouton affiche une icône micro et signale par un
 * toast que la fonctionnalité arrive — ce qui évite d'ajouter puis de
 * retirer un composant quand le backend sera prêt.
 *
 * Signature prête pour la suite : `onTranscribe(text)` sera appelé avec
 * le texte transcrit dès que l'API sera branchée. Le composant gère
 * déjà l'état `recording` pour que la bascule soit triviale.
 */
import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VoiceInputButton({
  onTranscribe,
  disabled,
  className,
}: {
  /** Sera appelé avec le texte transcrit (backend à venir). */
  onTranscribe?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [recording, setRecording] = useState(false);

  const handleClick = useCallback(() => {
    // Backend non branché : on simule la bascule visuelle puis on
    // informe l'utilisateur, sans jamais bloquer l'envoi écrit.
    if (recording) {
      setRecording(false);
      toast.info("Capture vocale annulée");
      return;
    }
    setRecording(true);
    toast.info("Envoi vocal — bientôt disponible", {
      description: "La dictée complète sera branchée prochainement.",
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