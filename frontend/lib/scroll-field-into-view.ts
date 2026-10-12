//frontend\lib\scroll-field-into-view.ts
/**
 * Fait défiler UNIQUEMENT le conteneur scrollable interne le plus proche
 * (jamais la fenêtre ni le document) pour amener `el` au-dessus du clavier
 * virtuel.
 *
 * À la différence de `el.scrollIntoView()` — qui remonte potentiellement
 * n'importe quel ancêtre scrollable jusqu'à la page elle-même, et dont le
 * calcul de centrage ignore le décalage déjà appliqué par nos panneaux
 * `position: fixed` ancrés au-dessus du clavier — cette fonction ne modifie
 * que le `scrollTop` du conteneur désigné (`scrollerSelector`). C'est ce qui
 * provoquait, sur Safari iOS, un champ "remontant trop haut pour rien" :
 * la page ET le conteneur interne tentaient chacun de compenser le clavier,
 * en double.
 */
export function scrollFieldAboveKeyboard(el: HTMLElement, scrollerSelector: string, margin = 16) {
  const scroller = el.closest(scrollerSelector) as HTMLElement | null;
  if (!scroller) return;

  const elRect = el.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();

  const overflowBottom = elRect.bottom + margin - scrollerRect.bottom;
  if (overflowBottom > 0) {
    scroller.scrollTop += overflowBottom;
    return;
  }

  const overflowTop = scrollerRect.top + margin - elRect.top;
  if (overflowTop > 0) {
    scroller.scrollTop -= overflowTop;
  }
}
