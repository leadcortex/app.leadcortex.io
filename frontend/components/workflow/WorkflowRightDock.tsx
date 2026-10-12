"use client";

/**
 * Panneau droit du canevas — deux vues dans une seule barre :
 *
 *   [ Propriétés ]  [ Assistant IA ]
 *
 *  - « Propriétés » : l'inspecteur de bloc existant (`RightPanel`).
 *  - « Assistant IA » : le chat du canevas (`WorkflowChatPanel`) qui
 *    réutilise toutes les primitives de l'assistant latéral.
 *
 * Les deux vues sont **montées en permanence** et basculées via la
 * classe CSS `hidden` : le texte en cours de saisie dans le chat n'est
 * jamais perdu quand on fait un aller-retour vers les Propriétés.
 *
 * L'onglet actif est persisté (`localStorage`) — au prochain démarrage
 * l'utilisateur retrouve l'onglet qu'il préfère.
 *
 * Le composant accepte un mode `collapsed` (mobile : dock plié) où seules
 * les deux pastilles d'onglets sont rendues ; un clic sur une pastille
 * déclenche `onRequestExpand` en plus du changement d'onglet, ce qui
 * permet de déplier le dock en un geste.
 */
import { useState } from "react";
import { Sliders, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RightPanel } from "./RightPanel";
import { WorkflowChatPanel } from "./WorkflowChatPanel";

export type RightDockTab = "inspector" | "assistant";

const STORAGE_KEY = "workflow:right-dock-tab";

function readTab(): RightDockTab {
  if (typeof window === "undefined") return "inspector";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "assistant" ? "assistant" : "inspector";
  } catch {
    return "inspector";
  }
}

export function WorkflowRightDock({
  collapsed = false,
  onRequestExpand,
  className,
}: {
  /** Dock mobile plié : seules les pastilles d'onglets sont visibles. */
  collapsed?: boolean;
  /** Appelé quand l'utilisateur clique une pastille alors que le dock est plié. */
  onRequestExpand?: () => void;
  className?: string;
}) {
  const [tab, setTab] = useState<RightDockTab>(readTab);
  const showContent = !collapsed;

  const select = (next: RightDockTab) => {
    setTab(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Intentionally ignored. */
    }
  };

  const handleTabClick = (next: RightDockTab) => {
    if (!showContent) {
      onRequestExpand?.();
      select(next);
      return;
    }
    select(next);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-panel", className)}>
      <div
        role="tablist"
        aria-label="Panneau du canevas"
        className="flex shrink-0 items-stretch border-b border-border"
      >
        <TabButton
          icon={Sliders}
          label="Propriétés"
          active={tab === "inspector"}
          onClick={() => handleTabClick("inspector")}
        />
        <TabButton
          icon={Sparkles}
          label="Assistant IA"
          active={tab === "assistant"}
          onClick={() => handleTabClick("assistant")}
        />
      </div>

      {showContent && (
        <>
          <div
            role="tabpanel"
            aria-label="Propriétés du bloc"
            className={cn(
              "min-h-0 flex-1 overflow-hidden",
              tab !== "inspector" && "hidden",
            )}
          >
            <RightPanel hideHeader />
          </div>
          <div
            role="tabpanel"
            aria-label="Assistant IA du workflow"
            className={cn(
              "min-h-0 flex-1 overflow-hidden",
              tab !== "assistant" && "hidden",
            )}
          >
            <WorkflowChatPanel />
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sliders;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2 : 1.7} />
      <span className="truncate">{label}</span>
      {active && (
        <span className="pointer-events-none absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}