"use client";

import { useEffect, useState } from "react";
import { Handshake, LogOut, Menu, X } from "lucide-react";
import { NavLinks } from "@/components/nav-links";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function MobileNavDrawer({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="safe-top sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-hairline bg-canvas/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-hairline">
            <Handshake className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-serif text-base text-ink">Super Gestão</p>
            <p className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground/70">
              Estratégia · OAB + ECJ
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink hover:bg-surface"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />
          <aside
            className={cn(
              "safe-top safe-bottom absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18rem)] flex-col",
              "border-r border-hairline bg-canvas px-3 py-5 shadow-elev"
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-hairline">
                  <Handshake className="h-4 w-4" />
                </div>
                <p className="font-serif text-base text-ink">Super Gestão</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-ink"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div onClick={() => setOpen(false)}>
              <NavLinks user={user} mobile />
            </div>

            <div className="mt-auto border-t border-hairline pt-3">
              <p className="truncate px-3 text-xs font-medium text-ink">{user.name}</p>
              <p className="px-3 text-[0.65rem] uppercase tracking-wider text-muted-foreground/70">{user.role}</p>
              <form action="/api/auth/logout" method="POST" className="mt-2">
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
