// frontend/hooks/use-keyboard-shortcuts.ts

import { useEffect, useRef } from "react";

export type KeyboardShortcut = {
  key: string;
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void | boolean;
  allowInInput?: boolean;
  disabled?: boolean;
};

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "OS"]);

function isTypingContext(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.getAttribute("role") === "textbox") return true;
  return false;
}

function normalizeKey(e: KeyboardEvent): string {
  const k = e.key;
  if (k === " ") return " ";
  return k.toLowerCase();
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(e.key)) return;

      const typing = isTypingContext(e.target);
      const key = normalizeKey(e);
      const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

      const modActive = isMac ? e.metaKey || e.ctrlKey : e.ctrlKey || e.metaKey;

      for (const s of shortcutsRef.current) {
        if (s.disabled) continue;
        if (typing && !s.allowInInput) continue;
        if (normalizeKey({ key: s.key } as KeyboardEvent) !== key) continue;
        if (!!s.mod !== modActive) continue;
        if (!!s.shift !== e.shiftKey) continue;
        if (!!s.alt !== e.altKey) continue;

        const result = s.handler(e);
        if (result === false) continue;

        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function useSequentialShortcuts(
  sequences: Record<string, () => void>,
  enabled = true,
) {
  const timeoutRef = useRef<number | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (isTypingContext(e.target)) return;
      if (MODIFIER_KEYS.has(e.key)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();

      if (armedRef.current) {
        const target = sequences[k];
        armedRef.current = false;
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (target) {
          e.preventDefault();
          e.stopImmediatePropagation();
          target();
        }
        return;
      }

      if (k === "g") {
        armedRef.current = true;
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          armedRef.current = false;
          timeoutRef.current = null;
        }, 800);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      armedRef.current = false;
    };
  }, [enabled, sequences]);
}
