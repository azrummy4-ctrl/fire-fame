import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useIsAdmin } from "@/lib/api";

const tabs = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/tournaments", label: "Tournaments" },
  { to: "/admin/deposits", label: "Deposits" },
  { to: "/admin/withdrawals", label: "Withdrawals" },
  { to: "/admin/users", label: "Users" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[480px] p-6">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[480px] p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aapke account ke paas admin access nahi hai.
        </p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          Back to app
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
      <header className="app-header-gradient sticky top-0 z-30 rounded-b-2xl px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl font-bold tracking-wide text-gold">Admin Panel</p>
          <Link to="/" className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold">
            Exit
          </Link>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                pathname === t.to ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}
