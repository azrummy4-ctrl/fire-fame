import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, UserRound, Ban, CircleCheck } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { listAdminUsers } from "@/lib/admin-users.functions";
import { formatINR } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management | FireZone Admin" },
      { name: "description", content: "Search FireZone accounts and review player status and coins." },
      { property: "og:title", content: "User Management | FireZone Admin" },
      { property: "og:description", content: "Search player accounts and manage blocked users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const listUsers = useServerFn(listAdminUsers);
  const [search, setSearch] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "user-list", search, showBlocked],
    queryFn: () => listUsers({ data: { search, status: showBlocked ? "blocked" : "all", page: 1 } }),
  });
  const total = users[0]?.total_count ?? 0;

  return (
    <AdminShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} player accounts</p>
        </div>
        <Button
          type="button"
          variant={showBlocked ? "default" : "outline"}
          size="sm"
          onClick={() => setShowBlocked((value) => !value)}
        >
          {showBlocked ? <CircleCheck /> : <Ban />}
          {showBlocked ? "All users" : "Blocked"}
        </Button>
      </div>

      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or Gmail"
          maxLength={120}
          className="h-11 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </label>

      {isLoading ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">Loading players…</p>
      ) : isError ? (
        <p className="mt-5 rounded-md border border-destructive/40 bg-surface p-4 text-sm">Players load nahi hue. Dobara try karein.</p>
      ) : users.length === 0 ? (
        <p className="mt-5 rounded-md border border-border bg-surface p-5 text-center text-sm text-muted-foreground">Koi player nahi mila.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {users.map((user) => (
            <li key={user.user_id}>
              <Link
                to="/admin/users/$userId"
                params={{ userId: user.user_id }}
                className="flex min-h-20 items-center gap-3 py-3 transition-colors hover:bg-surface/70"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
                  <UserRound className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{user.ign || "Player"}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email || "Gmail unavailable"}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-gold">{formatINR(Number(user.balance))}</span>
                  <span className={`text-[10px] font-semibold uppercase ${user.status === "active" ? "text-success" : "text-live"}`}>
                    {user.status === "active" ? "Active" : "Blocked"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!showBlocked && total > users.length && (
        <p className="mt-3 text-center text-xs text-muted-foreground">Showing first {users.length} of {total}; use search to find others.</p>
      )}
    </AdminShell>
  );
}