"use client";

/**
 * Boutons d'approbation 👍/👎 — sélection exclusive, cliquables pour
 * annuler (re-cliquer sur le même pouce le retire). Le parent persiste la
 * valeur ; ce composant est purement contrôlé.
 */
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type FeedbackValue = "up" | "down" | null;

export function FeedbackButtons({
  value,
  onChange,
  size = "sm",
  disabled,
}: {
  value: FeedbackValue;
  onChange: (next: FeedbackValue) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const dims = size === "md" ? "size-8" : "size-7";
  const icon = size === "md" ? "size-4" : "size-3.5";

  const Base = ({
    active,
    tooltip,
    onClick,
    children,
  }: {
    active: boolean;
    tooltip: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          aria-pressed={active}
          className={cn(
            "grid place-items-center rounded-md transition-colors disabled:opacity-40",
            dims,
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex items-center gap-0">
      <Base
        active={value === "up"}
        tooltip={value === "up" ? "Retirer l'approbation" : "Réponse utile"}
        onClick={() => onChange(value === "up" ? null : "up")}
      >
        <ThumbsUp className={icon} strokeWidth={value === "up" ? 2.4 : 1.8} />
      </Base>
      <Base
        active={value === "down"}
        tooltip={value === "down" ? "Retirer le rejet" : "Réponse à améliorer"}
        onClick={() => onChange(value === "down" ? null : "down")}
      >
        <ThumbsDown className={icon} strokeWidth={value === "down" ? 2.4 : 1.8} />
      </Base>
    </div>
  );
}