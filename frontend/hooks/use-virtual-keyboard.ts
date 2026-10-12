//frontend\hooks\use-virtual-keyboard.ts
import { useEffect, useRef, useState } from "react";

/**
 * En dessous de ce seuil, une variation de `visualViewport` est presque
 * toujours due à la barre d'adresse / navigation de Safari qui se
 * rétracte ou réapparaît (variation typique : 40 à 90px), pas à l'ouverture
 * du clavier virtuel (qui masque au minimum ~200px, généralement 260-350px).
 * Sans ce seuil, la barre de navigation seule suffirait à déclencher un
 * décalage de l'UI — c'est ce qui produisait le "saut" du champ sans raison
 * apparente.
 */
const KEYBOARD_OPEN_THRESHOLD = 150;

/**
 * Délai (ms) après lequel on force une nouvelle mesure lorsqu'un champ perd
 * le focus : sur iOS Safari, l'évènement `resize`/`scroll` de
 * `visualViewport` ne se déclenche pas toujours de façon fiable à la
 * fermeture du clavier. Sans cette sécurité, `inset` peut rester bloqué à
 * une valeur non nulle après fermeture du clavier — ce qui, en pratique,
 * empêchait de replier à nouveau le panneau (ses contrôles se retrouvaient
 * décalés hors de l'écran).
 */
const REMEASURE_DELAYS = [50, 150, 350, 600];

/**
 * Suit l'état du clavier virtuel via l'API VisualViewport, en étant robuste
 * aux particularités de Safari iOS :
 *  - `inset` : hauteur (px) actuellement masquée par le clavier, à utiliser
 *    pour décaler les éléments `position: fixed` ancrés en bas d'écran.
 *  - `isOpen` : booléen basé sur un seuil, pour ignorer les micro-variations
 *    dues à la barre de navigation Safari.
 *  - `viewportHeight` : hauteur (px) réellement visible à l'écran en ce
 *    moment (visualViewport.height). À utiliser pour plafonner la hauteur
 *    de tout panneau ancré en bas, afin que son bord haut (poignée, onglets…)
 *    ne soit jamais poussé au-dessus du haut de l'écran par le décalage du
 *    clavier.
 */
export function useVirtualKeyboard() {
  const [inset, setInset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window === "undefined" ? 800 : window.innerHeight,
  );

  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const measure = () => {
      const diff = window.innerHeight - vv.height - vv.offsetTop;
      const next = Math.max(0, Math.round(diff));
      setInset(next);
      setIsOpen(next > KEYBOARD_OPEN_THRESHOLD);
      setViewportHeight(Math.round(vv.height));
    };

    const scheduleMeasure = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    // Sécurité anti-blocage : après toute perte de focus dans la page (donc

    // mesures espacées plutôt qu'une seule — Safari peut mettre plusieurs
    // centaines de ms à stabiliser `visualViewport` après la fermeture.
    const onFocusOut = () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = REMEASURE_DELAYS.map((delay) => window.setTimeout(measure, delay));
    };

    vv.addEventListener("resize", scheduleMeasure);
    vv.addEventListener("scroll", scheduleMeasure);
    document.addEventListener("focusout", onFocusOut);
    measure();

    return () => {
      vv.removeEventListener("resize", scheduleMeasure);
      vv.removeEventListener("scroll", scheduleMeasure);
      document.removeEventListener("focusout", onFocusOut);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return { inset, isOpen, viewportHeight };
}

/**
 * @deprecated Conservé uniquement pour compatibilité avec le code existant
 * qui n'a besoin que du décalage brut. Préférer `useVirtualKeyboard()` pour
 * tout nouveau composant, notamment lorsqu'il faut aussi plafonner une
 * hauteur (`viewportHeight`) ou réagir à l'ouverture/fermeture (`isOpen`).
 */
export function useKeyboardInset() {
  return useVirtualKeyboard().inset;
}
