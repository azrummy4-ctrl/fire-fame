import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({
    meta: [
      { title: "Deposits & Withdrawals | FireZone Admin" },
      { name: "description", content: "Verify deposits and settle player withdrawal requests securely." },
      { property: "og:title", content: "Payments | FireZone Admin" },
      { property: "og:description", content: "Deposit verification and withdrawal settlement." },
    ],
  }),
  component: AdminPayments,
});

function AdminPayments() {
  const qc = useQueryClient();

  const { data: deposits } = useQuery({
    queryKey: ["admin", "deposits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function settleDeposit(id: string, decision: "completed" | "failed") {
    const { error } = await supabase.rpc("admin_settle_deposit", { _id: id, _decision: decision });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deposit ${decision}`);
    qc.invalidateQueries();
  }

  async function settleWithdrawal(id: string, decision: "completed" | "rejected") {
    const { error } = await supabase.rpc("admin_settle_withdrawal", { _id: id, _decision: decision });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Withdrawal ${decision}`);
    qc.invalidateQueries();
  }

  return (
    <AdminShell>
      <h2 className="font-display text-lg font-bold">Deposits</h2>
      <ul className="mt-2 space-y-2">
        {(deposits ?? []).map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">{formatINR(Number(d.amount))}</p>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{d.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Ref {d.provider_ref} · {formatDateTime(d.created_at)}
            </p>
            {d.status === "pending" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => settleDeposit(d.id, "completed")} className="rounded-lg bg-success py-2 text-xs font-bold text-background">
                  Approve
                </button>
                <button onClick={() => settleDeposit(d.id, "failed")} className="rounded-lg bg-surface-2 py-2 text-xs font-bold text-live">
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
        {(deposits ?? []).length === 0 && <Empty />}
      </ul>

      <h2 className="mt-6 font-display text-lg font-bold">Withdrawals</h2>
      <ul className="mt-2 space-y-2">
        {(withdrawals ?? []).map((w) => (
          <li key={w.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">{formatINR(Number(w.amount))}</p>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{w.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {w.upi_id} · {formatDateTime(w.created_at)}
            </p>
            {w.status === "pending" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => settleWithdrawal(w.id, "completed")} className="rounded-lg bg-success py-2 text-xs font-bold text-background">
                  Mark paid
                </button>
                <button onClick={() => settleWithdrawal(w.id, "rejected")} className="rounded-lg bg-surface-2 py-2 text-xs font-bold text-live">
                  Reject & refund
                </button>
              </div>
            )}
          </li>
        ))}
        {(withdrawals ?? []).length === 0 && <Empty />}
      </ul>
    </AdminShell>
  );
}

function Empty() {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
      Kuch pending nahi.
    </li>
  );
}
