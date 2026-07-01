"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/entregas", label: "Controle do mês" },
  { href: "/entregas/posts", label: "Posts do Forms" },
] as const;

export function EntregasNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex gap-1 rounded-lg border border-hairline bg-surface/50 p-1">
      {TABS.map((tab) => {
        const active =
          tab.href === "/entregas" ? pathname === "/entregas" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-white text-ink shadow-hairline"
                : "text-muted-foreground hover:bg-white/60 hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
