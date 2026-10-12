"use client";

/**
 * Indices contextuels de première visite.
 *
 * Trois bulles indépendantes, non bloquantes :
 *  - `welcome` : au-dessus du composeur, explique qu'on peut joindre un
 *    fichier, citer du texte, naviguer dans l'historique.
 *  - `search`  : dans le header, à côté de l'icône recherche, après le 3ᵉ
 *    message.
 *  - `drag`    : près du composeur, quand l'utilisateur n'a encore jamais
 *    joint de fichier après 2 échanges.
 *
 * Chaque bulle se ferme par un clic n'importe où ou après un délai de 8 s.
 * Rien ne revient une fois vu (état géré par `assistant-onboarding.ts`).
 */

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingHint = "welcome" | "search" | "drag";

export function OnboardingHintBubble({
  visible,
  title,
  body,
  placement = "top",
  onDismiss,
  className,
}: {
  visible: boolean;
  title: string;
  body: string;
  placement?: "top" | "bottom";
  onDismiss: () => void;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const timer = window.setTimeout(onDismiss, 8000);
      return () => window.clearTimeout(timer);
    }
    setMounted(false);
    return undefined;
  }, [visible, onDismiss]);

  if (!visible || !mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto absolute z-40 w-[230px] rounded-xl border border-primary/30 bg-popover p-2.5 shadow-xl animate-in fade-in-0 duration-200",
        placement === "top" ? "slide-in-from-bottom-2 bottom-full mb-2" : "slide-in-from-top-2 top-full mt-2",
        className,
      )}
    >
      <div className="mb-1 flex items-start gap-1.5">
        <Sparkles className="mt-px size-3.5 shrink-0 text-primary" strokeWidth={2} />
        <p className="text-[11.5px] font-semibold leading-snug">{title}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer l'indice"
          className="ml-auto -mr-1 -mt-1 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>
      <p className="ml-[18px] text-[11px] leading-snug text-muted-foreground">{body}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-2 ml-[18px] inline-flex items-center gap-1 text-[10.5px] font-medium text-primary hover:underline"
      >
        J'ai compris
        <ArrowRight className="size-3" strokeWidth={2} />
      </button>
    </div>
  );
}