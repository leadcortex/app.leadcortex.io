// frontend/lib/tabs/tab-scroll.ts

export const SCROLL_ATTR = "data-tab-scroll";

const STORAGE_KEY = "leadcortex.tab-scroll.v1";
const MAX_HREFS_PER_TAB = 12;
const WRITE_DELAY_MS = 300;
const SAVE_DEBOUNCE_MS = 250;
const INTENT_MS = 1500;
const SETTLE_MS = 400;
const SCROLL_KEYS = new Set(["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "]);

type ScrollMap = Record<string, Record<string, number>>;

let cache: ScrollMap | null = null;
let writeTimer: number | null = null;
let intentAt = 0;

function load(): ScrollMap {
  if (cache) return cache;
  cache = {};
  if (typeof window === "undefined") return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      cache = parsed as ScrollMap;
    }
  } catch {
  }
  return cache;
}

function flush(): void {
  if (writeTimer !== null) {
    window.clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (!cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
  }
}

function scheduleWrite(): void {
  if (typeof window === "undefined" || writeTimer !== null) return;
  writeTimer = window.setTimeout(flush, WRITE_DELAY_MS);
}

export function getSavedScroll(tabId: string, href: string): number | null {
  const y = load()[tabId]?.[href];
  return typeof y === "number" ? y : null;
}

export function saveScroll(tabId: string, href: string, y: number): void {
  const map = load();
  const entry = (map[tabId] ??= {});
  delete entry[href];
  entry[href] = Math.max(0, Math.round(y));
  const keys = Object.keys(entry);
  if (keys.length > MAX_HREFS_PER_TAB) {
    for (const k of keys.slice(0, keys.length - MAX_HREFS_PER_TAB)) delete entry[k];
  }
  scheduleWrite();
}

export function forgetScroll(tabId: string): void {
  const map = load();
  if (!(tabId in map)) return;
  delete map[tabId];
  scheduleWrite();
}

export function pruneScroll(validIds: string[]): void {
  const map = load();
  const keep = new Set(validIds);
  let changed = false;
  for (const id of Object.keys(map)) {
    if (!keep.has(id)) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) scheduleWrite();
}

export function getScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[${SCROLL_ATTR}]`);
}

function isScroller(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && target.hasAttribute(SCROLL_ATTR);
}

export function trackScroll(getCurrent: () => { id: string | null; href: string }): () => void {
  let dragging = false;
  let timer: number | null = null;

  const touch = () => {
    intentAt = performance.now();
  };
  const onKey = (e: KeyboardEvent) => {
    if (SCROLL_KEYS.has(e.key)) touch();
  };
  const onPointerDown = (e: PointerEvent) => {
    if (isScroller(e.target)) {
      dragging = true;
      touch();
    }
  };
  const onPointerUp = () => {
    dragging = false;
  };
  const onScroll = (e: Event) => {
    if (!isScroller(e.target)) return;
    if (!dragging && performance.now() - intentAt > INTENT_MS) return;
    const cur = getCurrent();
    if (!cur.id) return;
    const id = cur.id;
    const y = e.target.scrollTop;
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => saveScroll(id, cur.href, y), SAVE_DEBOUNCE_MS);
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };

  const opts = { capture: true, passive: true } as const;
  document.addEventListener("scroll", onScroll, opts);
  document.addEventListener("wheel", touch, opts);
  document.addEventListener("touchmove", touch, opts);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    document.removeEventListener("scroll", onScroll, true);
    document.removeEventListener("wheel", touch, true);
    document.removeEventListener("touchmove", touch, true);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("pagehide", flush);
    document.removeEventListener("visibilitychange", onVisibility);
    if (timer !== null) window.clearTimeout(timer);
    flush();
  };
}

export function restoreScrollWhenReady(y: number, maxMs = 3000): () => void {
  let stopped = false;
  const startedAt = performance.now();
  let appliedAt = 0;

  const tick = () => {
    if (stopped || intentAt > startedAt) return;
    const now = performance.now();
    const el = getScroller();
    if (el) {
      const max = el.scrollHeight - el.clientHeight;
      if (!appliedAt && max >= y - 1) {
        el.scrollTop = y;
        appliedAt = now;
      } else if (appliedAt && Math.abs(el.scrollTop - y) > 2 && now - appliedAt < SETTLE_MS) {
        el.scrollTop = y;
      }
    }
    const done = appliedAt > 0 && now - appliedAt >= SETTLE_MS;
    if (!done && now - startedAt < maxMs) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return () => {
    stopped = true;
  };
}
