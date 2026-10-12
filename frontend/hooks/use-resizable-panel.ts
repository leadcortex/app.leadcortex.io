//frontend\hooks\use-resizable-panel.ts
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

export function useResizablePanel({
  initialWidth,
  minWidth,
  maxWidth,
  direction,
}: {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  direction: "left" | "right";
}) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(initialWidth);

  const onHandleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = width;
      setIsResizing(true);
    },
    [width],
  );

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const signedDelta = direction === "left" ? delta : -delta;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + signedDelta));
      setWidth(next);
    };

    const onUp = () => setIsResizing(false);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, direction, minWidth, maxWidth]);

  return { width, isResizing, onHandleMouseDown };
}
