// frontend/hooks/use-drag-range-selection.ts

import { useEffect, useRef, type PointerEvent, type RefObject } from "react";

type RangeSelectionUpdate = { id: string; selected: boolean };
type DragState = {
  pointerId: number;
  startIndex: number;
  lastIndex: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  selecting: boolean;
  moved: boolean;
  applied: boolean;
  original: Map<number, boolean>;
};

export function useDragRangeSelection<T extends { id: string }>({
  rootRef,
  items,
  selectedIds,
  onSelectRow,
}: {
  rootRef: RefObject<HTMLElement | null>;
  items: T[];
  selectedIds: Set<string>;
  onSelectRow: (id: string, selected: boolean) => void;
}) {
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const userSelectRef = useRef<string | null>(null);
  const itemsRef = useRef(items);
  const selectedIdsRef = useRef(selectedIds);
  const onSelectRowRef = useRef(onSelectRow);
  itemsRef.current = items;
  selectedIdsRef.current = selectedIds;
  onSelectRowRef.current = onSelectRow;

  const applyRangeRef = useRef<(index: number) => void>(() => {});
  applyRangeRef.current = (index) => {
    const drag = dragRef.current;
    if (!drag || index === drag.lastIndex) return;

    const first = Math.min(drag.startIndex, index);
    const last = Math.max(drag.startIndex, index);
    const previousFirst = Math.min(drag.startIndex, drag.lastIndex);
    const previousLast = Math.max(drag.startIndex, drag.lastIndex);
    const updates: RangeSelectionUpdate[] = [];

    for (let itemIndex = Math.min(first, previousFirst); itemIndex <= Math.max(last, previousLast); itemIndex++) {
      const inRange = itemIndex >= first && itemIndex <= last;
      const previouslyInRange =
        drag.applied && itemIndex >= previousFirst && itemIndex <= previousLast;
      const selected = inRange ? drag.selecting : drag.original.get(itemIndex);
      const previousSelected = previouslyInRange
        ? drag.selecting
        : drag.original.get(itemIndex);
      if (selected !== undefined && selected !== previousSelected) {
        updates.push({ id: itemsRef.current[itemIndex].id, selected });
      }
    }

    updates.forEach(({ id, selected }) => onSelectRowRef.current(id, selected));
    drag.lastIndex = index;
    drag.applied = true;
  };

  const findItemAtPoint = (x: number, y: number) => {
    const item = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-range-index]");
    const index = Number(item?.dataset.rangeIndex);
    return Number.isInteger(index) && index >= 0 && index < itemsRef.current.length
      ? index
      : null;
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || event.pointerType !== "mouse") return;
    const target = event.target as HTMLElement;
    if (!target.closest("[data-range-select]")) return;
    const item = target.closest<HTMLElement>("[data-range-index]");
    const index = Number(item?.dataset.rangeIndex);
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return;

    const original = new Map<number, boolean>();
    items.forEach((entry, itemIndex) => {
      original.set(itemIndex, selectedIds.has(entry.id));
    });

    dragRef.current = {
      pointerId: event.pointerId,
      startIndex: index,
      lastIndex: index,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      selecting: !selectedIds.has(items[index].id),
      moved: false,
      applied: false,
      original,
    };
  };

  useEffect(() => {
    const stopAutoScroll = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const restoreUserSelect = () => {
      if (userSelectRef.current !== null) {
        document.body.style.userSelect = userSelectRef.current;
        userSelectRef.current = null;
      }
    };

    const scrollAtPointer = () => {
      const drag = dragRef.current;
      const root = rootRef.current;
      if (!drag?.moved || !root) return false;

      const target = document.elementFromPoint(drag.x, drag.y);
      let verticalContainer: HTMLElement | null = null;
      for (let node: HTMLElement | null = root; node; node = node.parentElement) {
        const overflowY = getComputedStyle(node).overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          verticalContainer = node;
          break;
        }
      }

      const horizontalContainer = (() => {
        for (let node = target instanceof HTMLElement ? target : null; node; node = node.parentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (
            (overflowX === "auto" || overflowX === "scroll") &&
            node.scrollWidth > node.clientWidth
          ) {
            return node;
          }
        }
        return null;
      })();

      let scrolled = false;
      const edge = 56;
      if (verticalContainer) {
        const rect = verticalContainer.getBoundingClientRect();
        const direction = drag.y < rect.top + edge ? -1 : drag.y > rect.bottom - edge ? 1 : 0;
        const before = verticalContainer.scrollTop;
        if (direction) verticalContainer.scrollTop += direction * 12;
        scrolled ||= before !== verticalContainer.scrollTop;
      } else {
        const direction =
          drag.y < edge ? -1 : drag.y > window.innerHeight - edge ? 1 : 0;
        const before = document.scrollingElement?.scrollTop ?? 0;
        if (direction) window.scrollBy(0, direction * 12);
        scrolled ||= before !== (document.scrollingElement?.scrollTop ?? 0);
      }

      if (horizontalContainer) {
        const rect = horizontalContainer.getBoundingClientRect();
        const direction = drag.x < rect.left + edge ? -1 : drag.x > rect.right - edge ? 1 : 0;
        const before = horizontalContainer.scrollLeft;
        if (direction) horizontalContainer.scrollLeft += direction * 12;
        scrolled ||= before !== horizontalContainer.scrollLeft;
      }

      const index = findItemAtPoint(drag.x, drag.y);
      if (index !== null) applyRangeRef.current(index);
      return scrolled;
    };

    const autoScrollStep = () => {
      if (!scrollAtPointer()) {
        frameRef.current = null;
        return;
      }
      frameRef.current = requestAnimationFrame(autoScrollStep);
    };

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (!drag.moved && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 4) return;

      if (!drag.moved) userSelectRef.current = document.body.style.userSelect;
      drag.moved = true;
      document.body.style.userSelect = "none";
      event.preventDefault();

      const index = findItemAtPoint(drag.x, drag.y);
      if (index !== null) applyRangeRef.current(index);
      stopAutoScroll();
      frameRef.current = requestAnimationFrame(autoScrollStep);
    };

    const finishDrag = (pointerId: number, suppressClick: boolean) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== pointerId) return;
      dragRef.current = null;
      stopAutoScroll();
      restoreUserSelect();
      suppressClickRef.current = suppressClick && drag.moved;
      if (suppressClickRef.current) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    };

    const onPointerUp = (event: globalThis.PointerEvent) => finishDrag(event.pointerId, true);
    const onPointerCancel = (event: globalThis.PointerEvent) => finishDrag(event.pointerId, true);
    const onBlur = () => {
      const drag = dragRef.current;
      if (drag) finishDrag(drag.pointerId, false);
    };

    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerCancel, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);
      window.removeEventListener("blur", onBlur);
      stopAutoScroll();
      restoreUserSelect();
    };
  }, [rootRef]);

  return {
    onPointerDown,
    onDragStartCapture: (event: React.DragEvent<HTMLElement>) => {
      if (dragRef.current) event.preventDefault();
    },
    onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
