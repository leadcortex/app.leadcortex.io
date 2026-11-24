// frontend/lib/core/persist.ts

export const PREVIEW_FRAME_PREFIX = "lc-tab-preview";

export function parsePreviewFrame(): { tabId: string; scrollY: number } | null {
  if (typeof window === "undefined") return null;
  const name = window.name;
  if (typeof name !== "string" || !name.startsWith(`${PREVIEW_FRAME_PREFIX}:`)) return null;
  const [, tabId = "", y = "0"] = name.split(":");
  return { tabId, scrollY: Number(y) || 0 };
}

export function isPreviewFrame(): boolean {
  return parsePreviewFrame() !== null;
}

function lockStorageInPreviewFrame(): void {
  if (!isPreviewFrame()) return;
  try {
    const noop = () => {};
    Storage.prototype.setItem = noop;
    Storage.prototype.removeItem = noop;
    Storage.prototype.clear = noop;
  } catch {
  }
}

lockStorageInPreviewFrame();
