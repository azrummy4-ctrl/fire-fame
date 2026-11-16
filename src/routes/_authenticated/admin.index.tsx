import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ban, BellRing, Coins, CreditCard, Trophy, Users } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | FireZone" },
      { name: "description", content: "Overview of users, tournaments, deposits and pending withdrawals." },
      { property: "og:title", content: "Admin Dashboard | FireZone" },
      { property: "og:description", content: "Users, tournaments and payment overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, tournaments, withdrawals, deposits, logs] = await Promise.all([
        supabase.from("profiles").select("id,status", { count: "exact" }),
        supabase.from("tournaments").select("id", { count: "exact", head: true }),
        supabase.from("withdrawals").select("amount").eq("status", "pending"),
        supabase.from("deposits").select("amount").eq("status", "pending"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        users: users.count ?? 0,
        blocked: (users.data ?? []).filter((u) => u.status !== "active").length,
        tournaments: tournaments.count ?? 0,
        pendingWithdrawals: withdrawals.data ?? [],
        pendingDeposits: deposits.data ?? [],
        logs: logs.data ?? [],
      };
    },
  });

  const wd = (data?.pendingWithdrawals ?? []).reduce((s, w) => s + Number(w.amount), 0);
  const dp = (data?.pendingDeposits ?? []).reduce((s, d) => s + Number(d.amount), 0);

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Management aur tournaments ek jagah.</p>
      </div>

      <section className="mt-5">
        <h2 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Management</h2>
        <div className="grid grid-cols-2 gap-2">
        <Link to="/admin/users" className="contents">
          <Card icon={Users} label="Total Users" value={String(data?.users ?? 0)} hint="Click → Users" />
        </Link>
        <Link to="/admin/users?status=blocked" className="contents">
          <Card icon={Ban} label="Blocked users" value={String(data?.blocked ?? 0)} hint="Review / unblock" />
        </Link>
        <Link to="/admin/deposits" className="contents">
          <Card icon={CreditCard}
          label={`Pending withdrawals (${data?.pendingWithdrawals.length ?? 0})`}
          value={`${formatINR(dp)} deposits`}
          hint={`Withdrawals: ${formatINR(wd)}`} />
        </Link>
        <Link to="/admin/withdrawals" className="contents">
          <Card icon={CreditCard} label={`Payments · ${data?.pendingWithdrawals.length ?? 0} withdrawals`} value={formatINR(wd)} hint={`Deposits: ${formatINR(dp)}`} />
        </Link>
        <Link to="/admin/push" className="col-span-2">
          <Card icon={BellRing} label="Push Notification" value="Open →" hint="Push page khulega" />
        </Link>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Tournament</h2>
        <Link to="/admin/tournaments" className="block">
          <Card icon={Trophy} label="Tournaments" value={String(data?.tournaments ?? 0)} hint="Create aur manage contests →" />
        </Link>
      </section>

      <h2 className="mt-6 font-display text-lg font-bold">Recent admin activity</h2>
      <ul className="mt-2 space-y-2">
        {(data?.logs ?? []).map((l) => (
          <li key={l.id} className="rounded-xl border border-border bg-surface px-3 py-2 text-xs">
            <p className="font-semibold">{l.action}</p>
            <p className="text-muted-foreground">
              {l.target} · {formatDateTime(l.created_at)}
            </p>
          </li>
        ))}
        {(data?.logs ?? []).length === 0 && (
          <li className="rounded-xl border border-border bg-surface px-3 py-4 text-center text-xs text-muted-foreground">
            Koi activity nahi.
          </li>
        )}
      </ul>
    </AdminShell>
  );
}

function Card({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <div className="card-elevated h-full rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-primary" />
        <p className="min-w-0 truncate text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 break-words font-display text-lg font-bold text-gold">{value}</p>
      {hint && <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}
