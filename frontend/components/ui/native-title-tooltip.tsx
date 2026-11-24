// frontend/components/ui/native-title-tooltip.tsx

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TOOLTIP_CONTENT_CLASS_NAME } from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";

type TooltipTarget = {
  element: Element;
  text: string;
};

type TooltipPosition = {
  left: number;
  top: number;
};

type PointerPosition = {
  x: number;
  y: number;
};

const SHOW_DELAY_MS = 450;
const CURSOR_OFFSET = 10;

function getTooltipPosition(
  element: Element,
  tooltip: HTMLElement | null,
  pointer: PointerPosition | null,
): TooltipPosition {
  const rect = element.getBoundingClientRect();
  const width = tooltip?.offsetWidth ?? 0;
  const height = tooltip?.offsetHeight ?? 0;
  let left = pointer ? pointer.x + CURSOR_OFFSET : rect.left + rect.width / 2 - width / 2;
  let top = pointer ? pointer.y + CURSOR_OFFSET : rect.top - CURSOR_OFFSET - height;

  if (width && left + width > window.innerWidth - 8) {
    left = pointer ? pointer.x - CURSOR_OFFSET - width : window.innerWidth - 8 - width;
  }
  if (height && top + height > window.innerHeight - 8) {
    top = pointer ? pointer.y - CURSOR_OFFSET - height : rect.top - CURSOR_OFFSET - height;
  }
  if (!pointer && top < 8) top = rect.bottom + CURSOR_OFFSET;

  return {
    left: Math.max(8, Math.min(left, window.innerWidth - 8 - width)),
    top: Math.max(8, Math.min(top, window.innerHeight - 8 - height)),
  };
}

export function NativeTitleTooltip() {
  const [active, setActive] = useState<TooltipTarget | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const activeRef = useRef<TooltipTarget | null>(null);
  const titles = useRef(new WeakMap<Element, string>());
  const descriptions = useRef(new WeakMap<Element, string>());
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pointerPosition = useRef<PointerPosition | null>(null);
  const followsPointer = useRef(false);

  useEffect(() => {
    const titleValues = titles.current;
    let pointerTarget: Element | null = null;
    let focusedTarget: Element | null = null;
    let pendingTimer: ReturnType<typeof setTimeout> | undefined;

    const setTitle = (element: Element) => {
      const text = element.getAttribute("title");
      if (text === null) return;

      titleValues.set(element, text);
      element.removeAttribute("title");
      const previousDescription = descriptions.current.get(element);
      if (
        previousDescription !== undefined &&
        element.getAttribute("aria-description") === previousDescription
      ) {
        if (text) {
          element.setAttribute("aria-description", text);
          descriptions.current.set(element, text);
        } else {
          element.removeAttribute("aria-description");
          descriptions.current.delete(element);
        }
      } else if (!element.hasAttribute("aria-description") && text) {
        element.setAttribute("aria-description", text);
        descriptions.current.set(element, text);
      }

      if (activeRef.current?.element === element) {
        const next = text.trim() ? { element, text } : null;
        activeRef.current = next;
        setActive(next);
        if (!next) setPosition(null);
      }
    };

    const scan = (root: ParentNode) => {
      root.querySelectorAll("[title]").forEach(setTitle);
      if (root instanceof Element && root.hasAttribute("title")) setTitle(root);
    };

    const findTarget = (node: Element | null): TooltipTarget | null => {
      if (!node || node.closest("[data-custom-tooltip-trigger]")) return null;

      for (let element: Element | null = node; element; element = element.parentElement) {
        if (titleValues.has(element)) {
          const text = titleValues.get(element) ?? "";
          return text.trim() ? { element, text } : null;
        }
      }
      return null;
    };

    const updatePosition = (element: Element) => {
      const pointer = followsPointer.current ? pointerPosition.current : null;
      setPosition(getTooltipPosition(element, tooltipRef.current, pointer));
    };

    const hide = () => {
      window.clearTimeout(pendingTimer);
      pendingTimer = undefined;
      activeRef.current = null;
      setActive(null);
      setPosition(null);
    };

    const schedule = (target: Element | null, delay: number) => {
      window.clearTimeout(pendingTimer);
      pendingTimer = undefined;

      const next = findTarget(target);
      if (!next) {
        activeRef.current = null;
        followsPointer.current = false;
        setActive(null);
        setPosition(null);
        return;
      }
      if (activeRef.current?.element === next.element && activeRef.current.text === next.text)
        return;

      followsPointer.current =
        pointerTarget !== null && findTarget(pointerTarget)?.element === next.element;
      pendingTimer = window.setTimeout(() => {
        if (!next.element.isConnected) return;
        updatePosition(next.element);
        activeRef.current = next;
        setActive(next);
      }, delay);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      pointerTarget = event.target instanceof Element ? event.target : null;
      schedule(pointerTarget ?? focusedTarget, SHOW_DELAY_MS);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      const target = event.target instanceof Element ? event.target : null;
      if (activeRef.current && findTarget(target)?.element === activeRef.current.element) {
        followsPointer.current = true;
        updatePosition(activeRef.current.element);
      }
    };

    const onPointerOut = (event: PointerEvent) => {
      const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
      const currentTarget = findTarget(event.target instanceof Element ? event.target : null);
      if (currentTarget && findTarget(related)?.element === currentTarget.element) return;

      pointerTarget = null;
      followsPointer.current = false;
      schedule(focusedTarget, focusedTarget ? 0 : SHOW_DELAY_MS);
      if (!focusedTarget) hide();
    };

    const onFocusIn = (event: FocusEvent) => {
      focusedTarget = event.target instanceof Element ? event.target : null;
      schedule(focusedTarget, SHOW_DELAY_MS);
    };

    const onFocusOut = (event: FocusEvent) => {
      const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
      const currentTarget = findTarget(event.target instanceof Element ? event.target : null);
      if (currentTarget && findTarget(related)?.element === currentTarget.element) return;

      focusedTarget = null;
      schedule(pointerTarget, pointerTarget ? 0 : SHOW_DELAY_MS);
      if (!pointerTarget) hide();
    };

    scan(document.body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof Element) {
          setTitle(record.target);
        } else {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) scan(node);
          });
        }
      }

      if (activeRef.current && !activeRef.current.element.isConnected) hide();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["title"],
    });

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    const onViewportChange = () => {
      if (activeRef.current?.element.isConnected) updatePosition(activeRef.current.element);
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      window.clearTimeout(pendingTimer);
    };
  }, []);

  useLayoutEffect(() => {
    if (active && position) {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const pointer = followsPointer.current ? pointerPosition.current : null;
      const next = getTooltipPosition(active.element, tooltip, pointer);
      if (Math.abs(position.left - next.left) > 1 || Math.abs(position.top - next.top) > 1) {
        setPosition(next);
      }
    }
  }, [active, position]);

  if (!active || !position || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="tooltip"
      ref={tooltipRef}
      className={cn(
        TOOLTIP_CONTENT_CLASS_NAME,
        "pointer-events-none fixed z-[100] max-w-[min(20rem,calc(100vw-1rem))] whitespace-normal",
        "animate-in fade-in-0 zoom-in-95",
      )}
      style={{ left: position.left, top: position.top }}
    >
      {active.text}
    </div>,
    document.body,
  );
}
