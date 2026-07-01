"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Vertical } from "@/lib/constants";

const STORAGE_KEY = "super-gestao-vertical";

type VerticalContextValue = {
  vertical: Vertical;
  setVertical: (v: Vertical) => void;
};

const VerticalContext = createContext<VerticalContextValue | null>(null);

export function VerticalProvider({ children }: { children: React.ReactNode }) {
  const [vertical, setVerticalState] = useState<Vertical>("OAB");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "OAB" || saved === "ECJ") setVerticalState(saved);
  }, []);

  function setVertical(v: Vertical) {
    setVerticalState(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  return (
    <VerticalContext.Provider value={{ vertical, setVertical }}>
      {children}
    </VerticalContext.Provider>
  );
}

export function useVertical() {
  const ctx = useContext(VerticalContext);
  if (!ctx) throw new Error("useVertical must be used within VerticalProvider");
  return ctx;
}
