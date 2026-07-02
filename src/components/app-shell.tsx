import { NavLinks } from "@/components/nav-links";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { VerticalShell } from "@/components/vertical-shell";
import type { SessionUser } from "@/lib/auth";
import { Handshake, LogOut } from "lucide-react";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas bg-aurora-light lg:flex-row">
      <aside className="hidden h-screen w-56 shrink-0 flex-col border-r border-hairline bg-canvas/95 px-3 py-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2 px-3 pb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shadow-hairline">
            <Handshake className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-base text-ink">Super Gestão</p>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/70">
              Estratégia · OAB + ECJ
            </p>
          </div>
        </div>

        <NavLinks user={user} />

        <div className="mt-3 border-t border-hairline pt-3">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNavDrawer user={user} />
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <VerticalShell>{children}</VerticalShell>
        </main>
      </div>
    </div>
  );
}
