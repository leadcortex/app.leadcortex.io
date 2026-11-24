// frontend/lib/core/viewport-position.ts

export type MenuPosition = { top: number; left: number };

export function clampMenuPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  padding = 8,
): MenuPosition {
  if (typeof window === "undefined") return { top: y, left: x };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = x;
  if (left + width + padding > vw) left = vw - width - padding;
  if (left < padding) left = padding;

  const spaceBelow = vh - y - padding;
  const spaceAbove = y - padding;

  let top = y;
  if (spaceBelow < height && spaceAbove > spaceBelow) {
    top = y - height;
  }
  if (top + height + padding > vh) top = vh - height - padding;
  if (top < padding) top = padding;

  return { top, left };
}
