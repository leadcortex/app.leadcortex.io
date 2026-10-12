//frontend\lib\theme.tsx
// classe avant le premier paint pour éviter le flash clair.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "leadcortex:theme";
const DEFAULT_MODE: ThemeMode = "system";

type Ctx = {
  mode: ThemeMode;

  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;

  toggle: () => void;
};

const ThemeContext = createContext<Ctx>({
  mode: DEFAULT_MODE,
  resolved: "light",
  setMode: () => {},
  toggle: () => {},
});

function readStored(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* Intentionally ignored. */
  }
  return DEFAULT_MODE;
}

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemPreference() : mode;
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");

  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Démarre sur la valeur par défaut pour éviter tout écart SSR ; la

  // <head> a déjà posé la bonne classe sur <html> pour éviter le flash).
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = readStored();
    setModeState(stored);
  }, []);

  useEffect(() => {
    const next = resolveMode(mode);
    setResolved(next);
    applyTheme(next);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next: ResolvedTheme = mq.matches ? "dark" : "light";
      setResolved(next);
      applyTheme(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* Intentionally ignored. */
    }
  };

  const toggle = () => {
    setMode(resolved === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const THEME_INIT_SCRIPT = `(function(){try{var k='${STORAGE_KEY}';var s=localStorage.getItem(k);var m=(s==='light'||s==='dark'||s==='system')?s:'system';var r=(m==='system')?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;var d=document.documentElement;d.classList.toggle('dark',r==='dark');d.style.colorScheme=r;}catch(e){}})();`;
