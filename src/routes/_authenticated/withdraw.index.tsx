import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ChevronRight, Coins, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR, useSession, useWallet } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/withdraw/")({
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
  const [showHistory, setShowHistory] = useState(false);

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
        .select("id, amount, upi_id, status, created_at, method, admin_note")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const balance = Number(wallet?.balance ?? 0);
  const winnings = Number(wallet?.winnings ?? 0);
  const pending = requests?.some((request) => request.status === "pending") ?? false;
  const disabled = settings?.enabled === false || pending;

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
        <p className="text-sm text-muted-foreground">Withdrawable winnings</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="grid size-12 place-items-center rounded-full border-2 border-gold/50 bg-gold/15 text-gold"><Coins className="size-6" /></span>
          <span className="font-display text-5xl font-bold text-gold">{formatINR(winnings)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Total balance {formatINR(balance)} · Sirf winning cash withdraw ho sakta hai, deposit wala nahi.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Available Payment Methods</h2>
        <span className="text-xs font-bold uppercase text-muted-foreground">India</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {([
          { id: "google_play", label: "Google Play Redeem Code", icon: "▶", cls: "bg-primary/15 text-primary" },
          { id: "upi", label: "UPI Transfer", icon: "UPI", cls: "bg-success/15 text-success italic" },
        ] as const).map((m) => (
          <Link
            key={m.id}
            to="/withdraw/$method"
            params={{ method: m.id }}
            aria-disabled={disabled}
            onClick={disabled ? (event) => event.preventDefault() : undefined}
            className={`flex h-36 flex-col items-start justify-between rounded-lg border border-border bg-surface p-4 text-left transition hover:bg-surface-2 ${disabled ? "pointer-events-none opacity-50" : ""}`}
          >
            <span className={`grid size-12 place-items-center rounded-lg text-xl font-bold ${m.cls}`}>{m.icon}</span>
            <span className="flex w-full items-end justify-between gap-1 text-sm font-semibold">{m.label}<ChevronRight className="size-4 shrink-0 text-muted-foreground" /></span>
          </Link>
        ))}
      </div>

      {settings?.enabled === false && <p className="mt-3 text-sm text-muted-foreground">Aapke region mein withdrawal abhi available nahi hai.</p>}
      {pending && <p className="mt-3 text-sm text-gold">Aapki ek withdrawal request review mein hai. Status History mein dekhein.</p>}

      {showHistory && (
        <section className="mt-7 border-t border-border pt-5" aria-label="Withdrawal history">
          <h2 className="font-display text-xl font-bold">Withdrawal history</h2>
          {!requests && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
          {requests?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Abhi koi withdrawal nahi hai.</p>}
          <ul className="mt-3 space-y-2">
            {requests?.map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-3 border-b border-border py-3">
                <div className="min-w-0"><p className="font-semibold">{formatINR(Number(request.amount))}</p><p className="truncate text-xs text-muted-foreground">{request.upi_id} · {formatDateTime(request.created_at)}</p>{request.method === "google_play" && request.status === "completed" && request.admin_note && <p className="mt-1 select-all font-mono text-sm font-bold text-success">Code: {request.admin_note}</p>}</div>
                <span className="shrink-0 text-xs font-bold uppercase text-primary">{request.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
