//frontend\lib\layout-prefs.ts
import { useEffect, useState } from "react";

export type SidebarSide = "left" | "right";

export const SIDEBAR_SIDE_KEY = "lc.layout.sidebarSide";
export const SIDEBAR_SIDE_EVENT = "lc:layout-sidebar-side";

const DEFAULT_SIDEBAR_SIDE: SidebarSide = "left";

export function readSidebarSide(): SidebarSide {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_SIDE;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_SIDE_KEY);
    if (raw === "left" || raw === "right") return raw;
  } catch {
    /* Intentionally ignored. */
  }
  return DEFAULT_SIDEBAR_SIDE;
}

export function writeSidebarSide(side: SidebarSide) {
  if (typeof window === "undefined") return;
  if (side !== "left" && side !== "right") return;
  try {
    window.localStorage.setItem(SIDEBAR_SIDE_KEY, side);
  } catch {
    /* Intentionally ignored. */
  }
  try {
    window.dispatchEvent(new CustomEvent(SIDEBAR_SIDE_EVENT, { detail: side }));
  } catch {
    /* Intentionally ignored. */
  }
}

export function oppositeSide(side: SidebarSide): SidebarSide {
  return side === "left" ? "right" : "left";
}

export function useSidebarSide(): SidebarSide {
  const [side, setSide] = useState<SidebarSide>(() => readSidebarSide());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "left" || detail === "right") setSide(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_SIDE_KEY) setSide(readSidebarSide());
    };
    window.addEventListener(SIDEBAR_SIDE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SIDEBAR_SIDE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return side;
}

export type MobileNavSide = "bottom" | "top";

export const MOBILE_NAV_SIDE_KEY = "lc.layout.mobileNavSide";
export const MOBILE_NAV_SIDE_EVENT = "lc:layout-mobile-nav-side";

const DEFAULT_MOBILE_NAV_SIDE: MobileNavSide = "bottom";

export function readMobileNavSide(): MobileNavSide {
  if (typeof window === "undefined") return DEFAULT_MOBILE_NAV_SIDE;
  try {
    const raw = window.localStorage.getItem(MOBILE_NAV_SIDE_KEY);
    if (raw === "top" || raw === "bottom") return raw;
  } catch {
    /* Intentionally ignored. */
  }
  return DEFAULT_MOBILE_NAV_SIDE;
}

export function writeMobileNavSide(side: MobileNavSide) {
  if (typeof window === "undefined") return;
  if (side !== "top" && side !== "bottom") return;
  try {
    window.localStorage.setItem(MOBILE_NAV_SIDE_KEY, side);
  } catch {
    /* Intentionally ignored. */
  }
  try {
    window.dispatchEvent(new CustomEvent(MOBILE_NAV_SIDE_EVENT, { detail: side }));
  } catch {
    /* Intentionally ignored. */
  }
}

export function useMobileNavSide(): MobileNavSide {
  const [side, setSide] = useState<MobileNavSide>(() => readMobileNavSide());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "top" || detail === "bottom") setSide(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === MOBILE_NAV_SIDE_KEY) setSide(readMobileNavSide());
    };
    window.addEventListener(MOBILE_NAV_SIDE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MOBILE_NAV_SIDE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return side;
}
