"use client";

/**
 * Barre d'actions sous une réponse de l'assistant.
 *
 * Contenu (gauche → droite) :
 *   1. Copier la réponse complète
 *   2. Copier le dernier bloc de code — si la réponse en contient
 *   3. Relecture audio (désactivée — « bientôt »)
 *   4. Feedback 👍 / 👎
 *   5. Régénérer (optionnel, si `onRegenerate` est fourni)
 *
 * Les icônes sont **toujours visibles** : plus de `opacity-0` qui ne se
 * révèle qu'au survol de la bulle.
 */
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { SpeakButton } from "@/components/ui/speak-button";
import { FeedbackButtons } from "@/components/ui/feedback-buttons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AssistantMessage, FeedbackValue } from "./assistant-engine";

type CodeFence = { language: string; content: string };

/** Renvoie le PREMIER bloc de code au format ```lang … ``` du message. */
function extractFirstCode(text: string): CodeFence | null {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const m = /^```([\w+#-]*)\s*$/.exec(lines[i]!);
    if (m) {
      const lang = (m[1] || "text").toLowerCase();
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i]!)) {
        code.push(lines[i]!);
        i++;
      }
      return { language: lang, content: code.join("\n") };
    }
    i++;
  }
  return null;
}

export function MessageActions({
  message,
  feedback,
  onFeedback,
  onRegenerate,
  className,
}: {
  message: AssistantMessage;
  feedback: FeedbackValue;
  onFeedback: (next: FeedbackValue) => void;
  /** Si fourni, ajoute un bouton « Régénérer » à la fin de la barre. */
  onRegenerate?: () => void;
  className?: string;
}) {
  const codeFence = extractFirstCode(message.text);

  return (
    <div
      className={cn(
        "ml-8 flex items-center gap-0.5",
        "transition-opacity duration-150",
        className,
      )}
    >
      <CopyButton
        text={message.text}
        label="Copier la réponse"
        copiedLabel="Réponse copiée"
        size="sm"
      />

      {codeFence && (
        <CopyButton
          text={codeFence.content}
          label={`Copier le code ${codeFence.language !== "text" ? `(${codeFence.language})` : ""}`}
          copiedLabel="Code copié"
          size="sm"
        />
      )}

      <SpeakButton text={message.text} />
      <FeedbackButtons value={feedback} onChange={onFeedback} />

      {onRegenerate && (
        <>
          <span className="mx-0.5 h-4 w-px shrink-0 bg-border/60" aria-hidden />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onRegenerate}
                aria-label="Régénérer cette réponse"
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <RefreshCw className="size-3.5" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Régénérer</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}