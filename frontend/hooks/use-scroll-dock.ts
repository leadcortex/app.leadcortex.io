// frontend/hooks/use-scroll-dock.ts

import { useLayoutEffect, useState, type RefObject } from "react";

export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function measureBottomGutter(el: HTMLElement, scroller: HTMLElement): number {
  let total = 0;
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const cs = getComputedStyle(node);
    total += parseFloat(cs.paddingBottom) || 0;
    total += parseFloat(cs.borderBottomWidth) || 0;
    if (node === scroller) break;
    node = node.parentElement;
  }
  return total;
}

type DockHeightOptions = {
  active?: boolean;
  minHeight?: number;
};

export function useDockHeight(
  ref: RefObject<HTMLElement | null>,
  { active = true, minHeight = 0 }: DockHeightOptions = {},
): number | undefined {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const scroller = getScrollParent(el);
    if (!scroller) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const availableHeight = Math.floor(
        scroller.getBoundingClientRect().height - measureBottomGutter(el, scroller),
      );
      const next = Math.max(0, minHeight, availableHeight);
      setHeight((prev) => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();

    const ro = new ResizeObserver(schedule);
    for (let node: HTMLElement | null = el.parentElement; node; node = node.parentElement) {
      ro.observe(node);
      if (node === scroller) break;
    }
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [ref, active, minHeight]);

  return height;
}

type FadeOptions = {
  active?: boolean;
  range?: number;
};

export function useFadeBeforeOverlap(
  floatingRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  { active = true, range = 28 }: FadeOptions = {},
) {
  useLayoutEffect(() => {
    const floating = floatingRef.current;
    const target = targetRef.current;

    const reset = () => {
      if (!floating) return;
      floating.style.opacity = "";
      floating.style.visibility = "";
    };

    if (!active || !floating || !target) {
      reset();
      return;
    }
    const scroller = getScrollParent(floating);
    if (!scroller) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const gap = target.getBoundingClientRect().top - floating.getBoundingClientRect().bottom;
      const o = Math.max(0, Math.min(1, gap / range));
      floating.style.opacity = String(o);
      floating.style.visibility = o === 0 ? "hidden" : "visible";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();

    scroller.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(scroller);
    ro.observe(target);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      reset();
    };
  }, [floatingRef, targetRef, active, range]);
}
