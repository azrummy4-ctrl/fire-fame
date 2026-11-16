import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useIsAdmin } from "@/lib/api";

const navigationGroups = [
  {
    heading: "Management",
    links: [
      { to: "/admin/users", label: "Users" },
      { to: "/admin/deposits", label: "Deposits" },
      { to: "/admin/withdrawals", label: "Withdrawals" },
      { to: "/admin/push", label: "Push Notification" },
    ],
  },
  {
    heading: "Tournament",
    links: [{ to: "/admin/tournaments", label: "Tournaments" }],
  },
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
        <nav className="mt-3 space-y-2">
          {navigationGroups.map((group) => (
            <section key={group.heading}>
              <p className="mb-1 px-1 text-[10px] font-bold uppercase text-muted-foreground">{group.heading}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {group.links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold ${
                      pathname === link.to || pathname.startsWith(`${link.to}/`)
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}
