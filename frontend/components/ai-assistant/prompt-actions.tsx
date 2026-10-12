"use client";

/**
 * Barre d'actions sous un prompt utilisateur.
 *
 * Contenu (gauche → droite) :
 *   1. Copier le prompt (le texte exact envoyé à l'IA)
 *   2. Modifier — ouvre la feuille d'édition ; à la validation, remplace
 *      le texte de la bulle d'origine (badge « modifié ») et régénère la
 *      réponse à partir de ce point (tout ce qui suit est ignoré).
 *   3. Relancer — supprime tout ce qui suit ce prompt et régénère la
 *      réponse de l'agent, sans modifier le texte du prompt.
 *
 * Icônes **toujours visibles** (plus de `opacity-0` au repos).
 */
import { Pencil, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
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
  /** Relance l'agent sur ce prompt (coupe tout ce qui suit). */
  onRelaunch: () => void;
  /** Ouvre la feuille de modification + relance. */
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