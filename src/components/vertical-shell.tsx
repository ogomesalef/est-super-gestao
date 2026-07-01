"use client";

import { VerticalProvider } from "@/components/vertical-context";
import { VerticalSelector } from "@/components/vertical-selector";

export function VerticalShell({ children }: { children: React.ReactNode }) {
  return (
    <VerticalProvider>
      <VerticalSelector />
      {children}
    </VerticalProvider>
  );
}
