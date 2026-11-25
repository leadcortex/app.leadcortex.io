// frontend/lib/core/layout-prefs.ts

import { useEffect, useState } from "react";
import {
  DEFAULT_NAV_LAYOUT,
  normalizeLayout,
  type MobileNavLayout,
} from "@/lib/mobile/nav-layout";

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
  }
  return DEFAULT_SIDEBAR_SIDE;
}

export function writeSidebarSide(side: SidebarSide) {
  if (typeof window === "undefined") return;
  if (side !== "left" && side !== "right") return;
  try {
    window.localStorage.setItem(SIDEBAR_SIDE_KEY, side);
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent(SIDEBAR_SIDE_EVENT, { detail: side }));
  } catch {
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
  }
  return DEFAULT_MOBILE_NAV_SIDE;
}

export function writeMobileNavSide(side: MobileNavSide) {
  if (typeof window === "undefined") return;
  if (side !== "top" && side !== "bottom") return;
  try {
    window.localStorage.setItem(MOBILE_NAV_SIDE_KEY, side);
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent(MOBILE_NAV_SIDE_EVENT, { detail: side }));
  } catch {
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

export const HIDE_ACADEMY_MOBILE_KEY = "lc.layout.hideAcademyMobile";
export const HIDE_ACADEMY_MOBILE_EVENT = "lc:layout-hide-academy-mobile";

const DEFAULT_HIDE_ACADEMY_MOBILE = false;

export function readHideAcademyFromMobile(): boolean {
  if (typeof window === "undefined") return DEFAULT_HIDE_ACADEMY_MOBILE;
  try {
    return window.localStorage.getItem(HIDE_ACADEMY_MOBILE_KEY) === "1";
  } catch {
  }
  return DEFAULT_HIDE_ACADEMY_MOBILE;
}

export function writeHideAcademyFromMobile(hidden: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIDE_ACADEMY_MOBILE_KEY, hidden ? "1" : "0");
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent(HIDE_ACADEMY_MOBILE_EVENT, { detail: hidden }));
  } catch {
  }
}

export function useHideAcademyFromMobile(): boolean {
  const [hidden, setHidden] = useState<boolean>(() => readHideAcademyFromMobile());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setHidden(typeof detail === "boolean" ? detail : readHideAcademyFromMobile());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === HIDE_ACADEMY_MOBILE_KEY) setHidden(readHideAcademyFromMobile());
    };
    window.addEventListener(HIDE_ACADEMY_MOBILE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(HIDE_ACADEMY_MOBILE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return hidden;
}

export const MOBILE_NAV_LAYOUT_KEY = "lc.layout.mobileNav";
export const MOBILE_NAV_LAYOUT_EVENT = "lc:layout-mobile-nav";

/** Sections de la barre mobile. Sans réglage enregistré, reprend l'ancien « masquer Academy ». */
export function readMobileNavLayout(): MobileNavLayout {
  if (typeof window === "undefined") return DEFAULT_NAV_LAYOUT;
  try {
    const stored = window.localStorage.getItem(MOBILE_NAV_LAYOUT_KEY);
    if (stored) return normalizeLayout(JSON.parse(stored));
    if (window.localStorage.getItem(HIDE_ACADEMY_MOBILE_KEY) === "1") {
      return { ...DEFAULT_NAV_LAYOUT, keys: DEFAULT_NAV_LAYOUT.keys.filter((k) => k !== "academy") };
    }
  } catch {
  }
  return DEFAULT_NAV_LAYOUT;
}

export function writeMobileNavLayout(layout: MobileNavLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOBILE_NAV_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent(MOBILE_NAV_LAYOUT_EVENT));
  } catch {
  }
}

/** Réglage courant de la barre mobile, mis à jour en direct (même onglet et autres onglets). */
export function useMobileNavLayout(): MobileNavLayout {
  const [layout, setLayout] = useState<MobileNavLayout>(() => readMobileNavLayout());

  useEffect(() => {
    const refresh = () => setLayout(readMobileNavLayout());
    const onStorage = (e: StorageEvent) => {
      if (e.key === MOBILE_NAV_LAYOUT_KEY || e.key === null) refresh();
    };
    window.addEventListener(MOBILE_NAV_LAYOUT_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MOBILE_NAV_LAYOUT_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return layout;
}
