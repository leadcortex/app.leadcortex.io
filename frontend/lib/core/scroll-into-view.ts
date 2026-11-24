// frontend/lib/core/scroll-into-view.ts

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
