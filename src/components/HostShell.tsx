import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useIsAdmin, useIsHost } from "@/lib/api";

export function HostShell({ children }: { children: ReactNode }) {
  const { data: isHost, isLoading } = useIsHost();
  const { data: isAdmin, isLoading: l2 } = useIsAdmin();

  if (isLoading || l2) {
    return (
      <div className="mx-auto w-full max-w-[480px] p-6">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (!isHost && !isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[480px] p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Host only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tournament host karne ke liye admin se permission lein.
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
          <div>
            <p className="font-display text-2xl font-bold tracking-wide text-gold">Host Dashboard</p>
            <p className="text-[11px] text-muted-foreground">Apne tournaments banao, room aur results publish karo</p>
          </div>
          <Link to="/" className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold">
            Exit
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}
