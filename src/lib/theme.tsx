"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Mode = "light" | "dark";
const KEY = "debtplanner.theme";

function currentMode(): Mode {
  if (typeof document !== "undefined") {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") return t;
  }
  return "dark";
}

const ThemeContext = createContext<{
  mode: Mode;
  toggle: () => void;
  setMode: (m: Mode) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start "dark" to match SSR, then sync to what the inline script applied
  // (deferred via rAF so this isn't a synchronous setState-in-effect).
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    const id = requestAnimationFrame(() => setModeState(currentMode()));
    return () => cancelAnimationFrame(id);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = m;
      try {
        localStorage.setItem(KEY, m);
      } catch {
        // ignore
      }
    }
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "dark" ? "light" : "dark"),
    [mode, setMode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// Runs before paint to set the theme with no flash. Inlined in <body>.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='dark';}})();`;
