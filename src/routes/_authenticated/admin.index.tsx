import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, tournaments, withdrawals, deposits, logs] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tournaments").select("id", { count: "exact", head: true }),
        supabase.from("withdrawals").select("amount").eq("status", "pending"),
        supabase.from("deposits").select("amount").eq("status", "pending"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        users: users.count ?? 0,
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
      <div className="grid grid-cols-2 gap-2">
        <Card label="Users" value={String(data?.users ?? 0)} />
        <Card label="Tournaments" value={String(data?.tournaments ?? 0)} />
        <Card
          label={`Pending withdrawals (${data?.pendingWithdrawals.length ?? 0})`}
          value={formatINR(wd)}
        />
        <Card label={`Pending deposits (${data?.pendingDeposits.length ?? 0})`} value={formatINR(dp)} />
      </div>

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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-elevated rounded-2xl border border-border p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold text-gold">{value}</p>
    </div>
  );
}
