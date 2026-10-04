import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, Coins, History, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR, useSession, useWallet } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — UPI Payout | FireZone" },
      { name: "description", content: "Request a UPI withdrawal from your FireZone wallet and track payout history." },
      { property: "og:title", content: "Withdraw | FireZone" },
      { property: "og:description", content: "Request a UPI withdrawal and track payout history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const { user } = useSession();
  const { data: wallet } = useWallet();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("value").eq("key", "payments").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as { enabled?: boolean; min_withdrawal?: number; max_withdrawal?: number };
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals")
        .select("id, amount, upi_id, status, created_at")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const min = settings?.min_withdrawal ?? 100;
  const max = settings?.max_withdrawal ?? 10000;
  const balance = Number(wallet?.balance ?? 0);
  const pending = requests?.some((request) => request.status === "pending") ?? false;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < min || value > max || value > balance) {
      toast.error(`₹${min}–₹${max} ke beech amount chunein, wallet balance se zyada nahi.`);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("request_withdrawal", { _amount: value, _upi: upi.trim() });
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["wallet"] }),
        qc.invalidateQueries({ queryKey: ["withdrawals", user?.id] }),
        qc.invalidateQueries({ queryKey: ["transactions", user?.id] }),
      ]);
      setShowForm(false);
      setShowHistory(true);
      setAmount("");
      setUpi("");
      toast.success("Withdrawal request bhej di. Admin review ke baad payment hoga.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal request nahi ho payi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
          <Link to="/wallet"><ArrowLeft /></Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Withdraw</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory((current) => !current)} className="text-primary">
          <History /> History
        </Button>
      </div>

      <div className="py-9 text-center">
        <p className="text-sm text-muted-foreground">Available balance</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="grid size-12 place-items-center rounded-full border-2 border-gold/50 bg-gold/15 text-gold"><Coins className="size-6" /></span>
          <span className="font-display text-5xl font-bold text-gold">{formatINR(balance)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Available Payment Methods</h2>
        <span className="text-xs font-bold uppercase text-muted-foreground">India</span>
      </div>

      <div className="mt-4 flex h-40 w-full flex-col items-start justify-between rounded-lg border border-border bg-surface px-5 py-5 opacity-60 sm:h-44" aria-label="Google Play Redeem Code unavailable">
        <span className="grid size-14 place-items-center rounded-lg bg-surface-2 text-2xl font-bold text-foreground">▶</span>
        <span className="flex w-full items-end justify-between gap-2 text-lg font-semibold">
          Google Play Redeem Code <span className="shrink-0 text-xs font-normal text-muted-foreground">Unavailable</span>
        </span>
      </div>

      <Button
        variant="outline"
        onClick={() => setShowForm((current) => !current)}
        disabled={settings?.enabled === false || pending}
        className="mt-3 flex h-40 w-full flex-col items-start justify-between rounded-lg border-primary/50 bg-surface px-5 py-5 text-left hover:bg-surface-2 sm:h-44"
      >
        <span className="grid size-14 place-items-center rounded-lg bg-success/15 text-2xl font-bold italic text-success">UPI</span>
        <span className="flex w-full items-end justify-between text-lg font-semibold">
          UPI Transfer <ChevronRight className="size-5 text-muted-foreground" />
        </span>
      </Button>

      {settings?.enabled === false && <p className="mt-3 text-sm text-muted-foreground">Aapke region mein withdrawal abhi available nahi hai.</p>}
      {pending && <p className="mt-3 text-sm text-gold">Aapki ek withdrawal request review mein hai. Status History mein dekhein.</p>}

      {showForm && settings?.enabled !== false && !pending && (
        <form onSubmit={submit} className="mt-5 space-y-4 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-primary"><ArrowUpRight className="size-5" /><h2 className="font-display text-xl font-bold">UPI withdrawal</h2></div>
          <p className="text-sm text-muted-foreground">Minimum {formatINR(min)} · Maximum {formatINR(max)} · ek waqt mein ek request.</p>
          <label className="block text-sm font-medium">Amount (₹)
            <input type="number" min={min} max={Math.min(max, balance)} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
          </label>
          <label className="block text-sm font-medium">UPI ID
            <input type="text" required value={upi} onChange={(event) => setUpi(event.target.value)} placeholder="name@bank" autoComplete="off" className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
          </label>
          <Button type="submit" disabled={busy || balance < min} className="h-12 w-full font-bold">
            {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Request withdrawal
          </Button>
          <p className="text-center text-xs text-muted-foreground">Request submit hone par amount hold hota hai; reject hone par wallet mein wapas aata hai.</p>
        </form>
      )}

      {showHistory && (
        <section className="mt-7 border-t border-border pt-5" aria-label="Withdrawal history">
          <h2 className="font-display text-xl font-bold">Withdrawal history</h2>
          {!requests && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
          {requests?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Abhi koi withdrawal nahi hai.</p>}
          <ul className="mt-3 space-y-2">
            {requests?.map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-3 border-b border-border py-3">
                <div className="min-w-0"><p className="font-semibold">{formatINR(Number(request.amount))}</p><p className="truncate text-xs text-muted-foreground">{request.upi_id} · {formatDateTime(request.created_at)}</p></div>
                <span className="shrink-0 text-xs font-bold uppercase text-primary">{request.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}