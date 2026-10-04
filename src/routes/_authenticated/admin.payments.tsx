import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR } from "@/lib/api";
import { validateMinimumWithdrawal } from "@/lib/withdrawal-settings";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({
    meta: [
      { title: "Deposits & Withdrawals | FireZone Admin" },
      { name: "description", content: "Verify deposits and settle player withdrawal requests securely." },
      { property: "og:title", content: "Payments | FireZone Admin" },
      { property: "og:description", content: "Deposit verification and withdrawal settlement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPayments,
});

function AdminPayments() {
  const qc = useQueryClient();
  const [minimum, setMinimum] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: paymentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("value").eq("key", "payments").single();
      if (error) throw error;
      return data.value as { enabled?: boolean; min_withdrawal?: number; max_withdrawal?: number; [key: string]: unknown };
    },
  });

  useEffect(() => {
    if (paymentSettings?.min_withdrawal != null) setMinimum(String(paymentSettings.min_withdrawal));
  }, [paymentSettings?.min_withdrawal]);

  async function saveMinimum(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentSettings) return;
    const maximum = Number(paymentSettings.max_withdrawal);
    const value = validateMinimumWithdrawal(minimum, maximum);
    if (value === null) {
      toast.error(`Minimum ₹1 se ₹${maximum} ke beech poori rakam honi chahiye.`);
      return;
    }
    if (value === paymentSettings.min_withdrawal) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("settings")
        .update({ value: { ...paymentSettings, min_withdrawal: value } })
        .eq("key", "payments")
        .select("value").single();
      if (error) throw error;
      if (!data) throw new Error("Setting save nahi hui.");
      await qc.invalidateQueries({ queryKey: ["settings", "payments"] });
      toast.success(`Minimum withdrawal ${formatINR(value)} set ho gaya.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Setting save nahi hui.");
    } finally {
      setSaving(false);
    }
  }

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

  async function settleWithdrawal(id: string, decision: "completed" | "rejected", method?: string) {
    let note: string | undefined;
    if (decision === "completed" && method === "google_play") {
      const code = window.prompt("Google Play redeem code daalein (user ko dikhega):")?.trim();
      if (!code) return;
      note = code;
    }
    const { error } = await supabase.rpc("admin_settle_withdrawal", { _id: id, _decision: decision, _note: note });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Withdrawal ${decision}`);
    qc.invalidateQueries();
  }

  return (
    <AdminShell>
      <section className="mb-6 border-b border-border pb-6">
        <h2 className="font-display text-xl font-bold">Withdrawal settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Minimum amount for new withdrawal requests.</p>
        <form onSubmit={saveMinimum} className="mt-4 flex items-end gap-3">
          <label className="min-w-0 flex-1 text-sm font-semibold" htmlFor="minimum-withdrawal">
            Minimum withdrawal (₹)
            <input
              id="minimum-withdrawal"
              type="number"
              inputMode="numeric"
              min="1"
              max={paymentSettings?.max_withdrawal}
              step="1"
              required
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              disabled={!paymentSettings || saving}
              className="mt-2 h-11 w-full rounded-md border border-input bg-surface px-3 text-foreground outline-none focus:border-primary"
            />
          </label>
          <Button type="submit" disabled={settingsLoading || !paymentSettings || saving || minimum === String(paymentSettings.min_withdrawal)} className="h-11 px-5">
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
        {paymentSettings && <p className="mt-2 text-xs text-muted-foreground">Maximum withdrawal: {formatINR(Number(paymentSettings.max_withdrawal))}</p>}
      </section>
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
                <button onClick={() => settleWithdrawal(w.id, "completed", w.method)} className="rounded-lg bg-success py-2 text-xs font-bold text-background">
                  {w.method === "google_play" ? "Send code" : "Mark paid"}
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
