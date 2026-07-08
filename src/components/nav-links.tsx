"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  BarChart3,
  Handshake,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  Users,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/contatos": Users,
  "/ativos": UserCheck,
  "/entregas": Package,
  "/financeiro": BadgeDollarSign,
  "/campanhas": Megaphone,
  "/emails": Mail,
  "/executive": BarChart3,
};

export function NavLinks({ user, mobile = false }: { user: SessionUser; mobile?: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  const [contatosBadge, setContatosBadge] = useState(0);

  useEffect(() => {
    if (user.role !== "admin") return;
    let cancelled = false;

    function refreshBadge() {
      fetch("/api/contatos/counts")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data?.sidebarTotal != null) {
            setContatosBadge(data.sidebarTotal);
          }
        })
        .catch(() => {});
    }

    refreshBadge();
    const timer = setInterval(refreshBadge, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user.role]);

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = ICONS[item.href] || LayoutDashboard;
        const badge = item.href === "/contatos" ? contatosBadge : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 text-sm font-medium transition-all duration-200",
              mobile ? "min-h-11 py-2.5" : "py-2",
              active ? "text-ink" : "text-muted-foreground hover:bg-surface hover:text-ink"
            )}
          >
            {active && (
              <span className="absolute inset-0 rounded-md bg-card shadow-hairline" aria-hidden />
            )}
            <Icon className={cn("relative z-10 h-4 w-4 shrink-0", active && "text-primary")} />
            <span className="relative z-10 truncate">{item.label}</span>
            {badge > 0 && (
              <span className="relative z-10 ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
