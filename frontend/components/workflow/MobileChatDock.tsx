//frontend\components\workflow\MobileChatDock.tsx
import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripHorizontal } from "lucide-react";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import { WorkflowRightDock } from "./WorkflowRightDock";
import { MOBILE_TOOLBAR_HEIGHT } from "./BottomToolbar";
import { MOBILE_TOP_BAR_HEIGHT } from "./MobileTopBar";
import { TERMINAL_COLLAPSED_HEIGHT } from "./Terminal";

/**
 * Hauteur du dock replié : poignée + barre d'onglets uniquement.
 * Aucun contenu interne (conversation, champ de saisie, inspecteur) ne doit
 * dépasser tant que l'utilisateur n'a pas ouvert le panneau explicitement.
 */
export const DOCK_COLLAPSED_HEIGHT = 68;

const EXPANDED_RATIO = 0.82;

const TOP_SAFE_MARGIN = 12;

const RESERVED_ABOVE =
  MOBILE_TOP_BAR_HEIGHT + MOBILE_TOOLBAR_HEIGHT + TERMINAL_COLLAPSED_HEIGHT + TOP_SAFE_MARGIN;

/**
 * Version mobile du panneau droit : dernier étage de la pile du bas
 * (barre d'outils → console → dock, voir `WorkflowEditor`), plutôt qu'une
 * barre latérale (plus naturelle au pouce). Il est EN FLUX dans cette pile :
 * c'est la pile — un seul élément `fixed` — qui est ancrée en bas et suit le
 * clavier ; le dock n'a donc plus de position propre à recalculer. Deux états :
 *  - repliée : seules les deux pastilles d'onglets (« Propriétés » /
 *    « Assistant IA ») sont visibles, le canevas reste totalement dégagé ;
 *  - dépliée : la vue sélectionnée (inspecteur ou chat du canevas) et son
 *    champ de saisie apparaissent, via le bouton d'extension.
 *
 * Le décalage vertical dû au clavier virtuel (API VisualViewport) est appliqué
 * à la pile entière par le parent, pour que le champ de saisie reste toujours
 * au-dessus du clavier plutôt que masqué par lui (limitation connue de
 * `position: fixed` + clavier sur iOS/Safari). La hauteur du dock est elle
 * aussi plafonnée à la zone réellement visible (`viewportHeight`) : sans ce
 * plafond, un dock de hauteur fixe ("82dvh") décalé vers le haut par le
 * clavier peut voir sa poignée et sa barre d'onglets poussées au-dessus du
 * haut de l'écran, devenant intouchables — c'est ce qui rendait le repliage
 * impossible une fois le clavier ouvert.
 */
export function MobileChatDock() {
  const [expanded, setExpanded] = useState(false);
  const { inset: keyboardInset, viewportHeight } = useVirtualKeyboard();
  const dockRef = useRef<HTMLDivElement>(null);

  // visible (`visualViewport.height`, exposée par `useVirtualKeyboard`),
  // jamais de `window.innerHeight`. Sur Android, la barre d'adresse et la

  // `window.innerHeight` ne change (surtout avec `interactive-widget:

  // retrouve coupé. `viewportHeight` se recalcule dynamiquement (listener
  // `resize`/`scroll` de `visualViewport`) et reste donc valide quelle que

  const expandedHeight = Math.max(
    DOCK_COLLAPSED_HEIGHT,
    Math.min(Math.round(viewportHeight * EXPANDED_RATIO), viewportHeight - RESERVED_ABOVE),
  );
  const height = expanded ? expandedHeight : DOCK_COLLAPSED_HEIGHT;

  /**
   * Replie le dock, et referme explicitement le clavier si un champ interne
   * a le focus : sans ce `blur()` manuel, le clavier peut rester ouvert
   * (le simple changement de hauteur du dock ne déclenche pas toujours sa
   * fermeture côté Safari), gardant tout décalé inutilement.
   */
  const collapse = () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && dockRef.current?.contains(active)) active.blur();
    setExpanded(false);
  };

  const toggle = () => (expanded ? collapse() : setExpanded(true));

  return (
    <div
      className="relative shrink-0"
      style={{
        height,
        transition: "height 200ms ease-out",
      }}
    >
      <div
        ref={dockRef}
        // `overscroll-none` : coupe l'effet de rebond Safari iOS sur le dock
        // lui-même, pour qu'un swipe rapide ne "tire" jamais le contenu et ne

        className="flex h-full flex-col overflow-hidden overscroll-none border-t border-border bg-panel"
        style={{
          paddingBottom: keyboardInset || !expanded ? 0 : "env(safe-area-inset-bottom)",
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Réduire l'assistant" : "Agrandir l'assistant"}
          className="flex shrink-0 items-center justify-center gap-1.5 py-1.5 text-muted-foreground"
        >
          <GripHorizontal className="h-3.5 w-3.5" />
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
        <div className="min-h-0 flex-1 overflow-hidden overscroll-none">
          <WorkflowRightDock
            collapsed={!expanded}
            onRequestExpand={() => setExpanded(true)}
          />
        </div>
        {}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-panel"
          style={{ height: "env(safe-area-inset-bottom, 0px)" }}
        />
      </div>
      {/*
        Bottom Shield : le `::after` de `.mobile-dock-shield` (défini dans
        styles.css, classe portée par la pile du bas dans `WorkflowEditor`)
        étend le même fond uni 500px sous la pile. Si Safari met du temps à
        recalculer visualViewport à l'ouverture/fermeture du clavier — décalage
        temporaire, overscroll, rebond — c'est ce fond que l'utilisateur voit
        apparaître, jamais le canevas en arrière-plan.
      */}
    </div>
  );
}