import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Coins, Loader2, Lock, ShieldCheck } from "lucide-react";
import { REDEEM_AMOUNTS, redeemProgress } from "@/lib/redeem";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, useSession, useWallet } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/withdraw/$method")({
  head: () => ({
    meta: [
      { title: "Redeem Voucher | FireZone" },
      { name: "description", content: "Choose a voucher amount and redeem your FireZone wallet balance." },
      { property: "og:title", content: "Redeem Voucher | FireZone" },
      { property: "og:description", content: "Choose a voucher amount and redeem your FireZone wallet balance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WithdrawMethodPage,
});

function WithdrawMethodPage() {
  const { method } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: wallet } = useWallet();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [upi, setUpi] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = method === "upi" || method === "google_play";

  const { data: settings } = useQuery({
    queryKey: ["settings", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("value").eq("key", "payments").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as { enabled?: boolean; min_withdrawal?: number; max_withdrawal?: number };
    },
  });

  const { data: pending } = useQuery({
    queryKey: ["withdrawals-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals")
        .select("id").eq("user_id", user?.id ?? "").eq("status", "pending").limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });

  const min = settings?.min_withdrawal ?? 100;
  const balance = Number(wallet?.balance ?? 0);
  const disabled = settings?.enabled === false || pending === true;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !selected) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("request_redeem", { _amount: selected, _method: method, ...(method === "upi" ? { _upi: upi.trim() } : {}) });
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["wallet"] }),
        qc.invalidateQueries({ queryKey: ["withdrawals", user?.id] }),
        qc.invalidateQueries({ queryKey: ["transactions", user?.id] }),
      ]);
      toast.success("Withdrawal request bhej di. Admin review ke baad payment hoga.");
      navigate({ to: "/withdraw" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal request nahi ho payi.");
    } finally {
      setBusy(false);
    }
  }

  if (!valid) {
    return (
      <AppShell>
        <p className="py-10 text-center text-muted-foreground">Ye payment method available nahi hai.</p>
        <Button asChild variant="outline" className="mx-auto block"><Link to="/withdraw">Back to Withdraw</Link></Button>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to withdraw">
          <Link to="/withdraw"><ArrowLeft /></Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">{method === "upi" ? "UPI Transfer" : "Google Play Redeem Code"}</h1>
      </div>

      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">Available balance</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Coins className="size-5 text-gold" />
          <span className="font-display text-4xl font-bold text-gold">{formatINR(balance)}</span>
        </div>
      </div>

      {settings?.enabled === false && <p className="text-sm text-muted-foreground">Aapke region mein withdrawal abhi available nahi hai.</p>}
      {pending && <p className="text-sm text-gold">Aapki ek withdrawal request review mein hai. Status History mein dekhein.</p>}

      {!disabled && (
        <>
          <h2 className="font-display text-xl font-bold">Redeem Vouchers</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {REDEEM_AMOUNTS.map((value) => {
              const locked = balance < value || value < min;
              return (
                <div key={value} className={`rounded-lg border bg-surface p-4 text-center ${selected === value ? "border-primary" : "border-border"}`}>
                  <p className="font-display text-2xl font-bold">{formatINR(value)}</p>
                  <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground"><Coins className="size-4 text-gold" />{Math.floor(Math.min(balance, value))} of {value}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${redeemProgress(balance, value)}%` }} /></div>
                  <Button size="sm" disabled={locked} onClick={() => setSelected(value)} className="mt-3 w-full rounded-full" aria-label={locked ? `${value} locked` : `Redeem ${value}`}>
                    {locked ? <Lock /> : "Redeem"}
                  </Button>
                </div>
              );
            })}
          </div>

          {selected && (
            <form onSubmit={submit} className="mt-5 space-y-4">
              {method === "upi" ? (
                <label className="block text-sm font-medium">UPI ID
                  <input type="text" required value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" autoComplete="off" className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
                </label>
              ) : (
                <p className="text-sm text-muted-foreground">Admin approve karne ke baad Google Play redeem code History mein dikhega.</p>
              )}
              <Button type="submit" disabled={busy} className="h-12 w-full font-bold">
                {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Redeem {formatINR(selected)}
              </Button>
            </form>
          )}
        </>
      )}
    </AppShell>
  );
}
