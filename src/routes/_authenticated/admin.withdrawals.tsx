import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR } from "@/lib/api";
import { validateMinimumWithdrawal } from "@/lib/withdrawal-settings";

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  head: () => ({
    meta: [
      { title: "Withdrawals | FireZone Admin" },
      { name: "description", content: "Settle player withdrawal requests and manage withdrawal settings." },
      { property: "og:title", content: "Withdrawals | FireZone Admin" },
      { property: "og:description", content: "Withdrawal settlement and settings for admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminWithdrawals,
});

function AdminWithdrawals() {
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

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function settleWithdrawal(id: string, decision: "completed" | "rejected", method?: string) {
    let note: string | undefined;
    if (decision === "completed" && method === "google_play") {
      const code = window.prompt("Google Play redeem code daalein (user ko dikhega):")?.trim();
      if (!code) return;
      note = code;
    }
    const { error } = await supabase.rpc("admin_settle_withdrawal", { _id: id, _decision: decision, ...(note ? { _note: note } : {}) });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Withdrawal ${decision}`);
    qc.invalidateQueries();
  }

  const pendingCount = (withdrawals ?? []).filter((w) => w.status === "pending").length;

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

      <h2 className="font-display text-lg font-bold">Withdrawal requests</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {isLoading ? "Loading…" : pendingCount > 0 ? `${pendingCount} withdrawal pending hai.` : "Koi withdrawal pending nahi hai."}
      </p>
      <ul className="mt-3 space-y-2">
        {(withdrawals ?? []).map((w) => (
          <li key={w.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">{formatINR(Number(w.amount))}</p>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{w.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {w.method === "google_play" ? "Google Play" : w.upi_id} · {formatDateTime(w.created_at)}
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
        {(withdrawals ?? []).length === 0 && (
          <li className="rounded-xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
            Kuch pending nahi.
          </li>
        )}
      </ul>
    </AdminShell>
  );
}
