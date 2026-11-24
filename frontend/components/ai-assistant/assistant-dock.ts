// frontend/components/ai-assistant/assistant-dock.ts

import { useSyncExternalStore } from "react";

export const ASSISTANT_DOCK_KEY = "lc.assistant.docked";
export const ASSISTANT_DOCK_EVENT = "lc:assistant-dock";

export function readAssistantDocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ASSISTANT_DOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAssistantDocked(docked: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ASSISTANT_DOCK_KEY, docked ? "1" : "0");
  } catch {
  }
  window.dispatchEvent(new CustomEvent(ASSISTANT_DOCK_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === ASSISTANT_DOCK_KEY) onChange();
  };
  window.addEventListener(ASSISTANT_DOCK_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ASSISTANT_DOCK_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAssistantDocked(): boolean {
  return useSyncExternalStore(subscribe, readAssistantDocked, () => false);
}
