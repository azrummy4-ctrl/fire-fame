import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Coins, Home, Trophy, Gamepad2, Wallet, User } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/my-games", label: "My Games", icon: Gamepad2 },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
      <header className="app-header-gradient sticky top-0 z-30 rounded-b-2xl px-4 pb-3 pt-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
              FZ
            </span>
            <span className="font-display text-2xl font-bold tracking-wide">FireZone</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/wallet"
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3"
            >
              <span className="grid size-6 place-items-center rounded-full bg-gold text-gold-foreground">
                <Coins className="size-3.5" />
              </span>
              <span className="text-sm font-semibold">₹0</span>
            </Link>
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="grid size-9 place-items-center rounded-full bg-surface-2 text-primary"
            >
              <Bell className="size-4.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="app-header-gradient fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] rounded-t-2xl border-t border-border">
        <ul className="grid grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                  <span
                    className={`h-0.5 w-6 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
