"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ExperienceMode = "Beginner" | "Advanced";

interface ModeContextValue {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);
const STORAGE_KEY = "nse-compass-mode";

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ExperienceMode>("Beginner");

  useEffect(() => {
    // Reads localStorage after mount (not in the initializer) so server and
    // first client render match, avoiding a hydration mismatch.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "Beginner" || stored === "Advanced") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModeState(stored);
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  function setMode(next: ExperienceMode) {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>
  );
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within a ModeProvider");
  return ctx;
}
