"use client";

import { useEffect, useState } from "react";
import { currentMonthRef } from "@/lib/utils";

function isValidMonthRef(v: string): boolean {
  return /^\d{4}-\d{2}$/.test(v);
}

export function usePersistedMonthRef(storageKey: string) {
  const [monthRef, setMonthRefState] = useState(currentMonthRef);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && isValidMonthRef(saved)) {
        setMonthRefState(saved);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function setMonthRef(next: string) {
    setMonthRefState(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* ignore */
    }
  }

  return [monthRef, setMonthRef] as const;
}
