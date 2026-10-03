import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR, useSession, useWallet } from "@/lib/api";
import { verifyDepositPayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Balance, Deposits & Withdrawals | FireZone" },
      { name: "description", content: "Check your tournament wallet balance, deposits, prizes and withdrawal history." },
      { property: "og:title", content: "Wallet | FireZone" },
      { property: "og:description", content: "Balance, transactions and withdrawal requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { user } = useSession();
  const { data: wallet } = useWallet();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<null | "add" | "withdraw">(null);
  const search = useSearch({ strict: false }) as { deposit_order?: string };
  const verifyFn = useServerFn(verifyDepositPayment);
  const verifyingRef = useRef(false);

  // ZapUpi se wapas aane par payment verify karo
  // Wallet khulte hi koi bhi pending UPI deposit ho to bhi khud verify karo
  useEffect(() => {
    if (!user || verifyingRef.current) return;
    verifyingRef.current = true;

    const run = async () => {
      const orderIds = new Set<string>();
      if (search.deposit_order) orderIds.add(search.deposit_order);
      const { data: pend } = await supabase
        .from("deposits")
        .select("provider_ref")
        .eq("user_id", user.id)
        .eq("provider", "zapupi")
        .eq("status", "pending")
        .limit(5);
      pend?.forEach((d) => d.provider_ref && orderIds.add(d.provider_ref));

      for (const orderId of orderIds) {
        const fromRedirect = orderId === search.deposit_order;
        let attempts = 0;
        const poll = async () => {
          attempts += 1;
          try {
            const res = await verifyFn({ data: { orderId } });
            if (res.status === "completed") {
              toast.success("Payment successful! Wallet me paise add ho gaye.");
              qc.invalidateQueries();
              if (fromRedirect) window.history.replaceState({}, "", "/wallet");
              return;
            }
            if (res.status === "failed") {
              if (fromRedirect) {
                toast.error("Payment fail ho gaya. Paise kate ho to support se contact karein.");
                window.history.replaceState({}, "", "/wallet");
              }
              return;
            }
            if (attempts < 40) setTimeout(poll, 2000);
            else if (fromRedirect) toast.info("Payment abhi verify ho raha hai. Thodi der me balance check karein.");
          } catch (e) {
            if (fromRedirect) toast.error(e instanceof Error ? e.message : "Verification failed");
          }
        };
        void poll();
      }
    };
    void run();
  }, [user, search.deposit_order, verifyFn, qc]);

  const { data: settings } = useQuery({
    queryKey: ["settings", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("value").eq("key", "payments").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as {
        enabled?: boolean;
        min_withdrawal?: number;
        max_withdrawal?: number;
        upi_payee?: string;
      };
    },
  });

  const { data: txns } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const payoutsOn = settings?.enabled !== false;

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Wallet</h1>

      <div className="card-elevated mt-3 rounded-2xl border border-border p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Available balance</p>
        <p className="font-display text-3xl font-bold text-gold">
          {formatINR(Number(wallet?.balance ?? 0))}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/add-money"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
          >
            <ArrowDownLeft className="size-4" /> Add Money
          </Link>
          <button
            type="button"
            disabled={!payoutsOn}
            onClick={() => setSheet(sheet === "withdraw" ? null : "withdraw")}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            <ArrowUpRight className="size-4" /> Withdraw
          </button>
        </div>
        {!payoutsOn && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Payouts aapke region ke liye abhi disabled hain.
          </p>
        )}
      </div>

      {sheet === "withdraw" && (
        <Withdraw
          min={settings?.min_withdrawal ?? 100}
          max={settings?.max_withdrawal ?? 10000}
          onDone={() => {
            setSheet(null);
            qc.invalidateQueries();
          }}
        />
      )}

      <h2 className="mt-6 font-display text-lg font-bold">Transactions</h2>
      {(txns ?? []).length === 0 ? (
        <p className="mt-2 rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Abhi koi transaction nahi hai.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {(txns ?? []).map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold capitalize">{t.type.replace("_", " ")}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.note ?? ""} · {formatDateTime(t.created_at)}
                </p>
              </div>
              <span className={`text-sm font-bold ${Number(t.amount) < 0 ? "text-live" : "text-success"}`}>
                {Number(t.amount) < 0 ? "-" : "+"}
                {formatINR(Math.abs(Number(t.amount)))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function Withdraw({ min, max, onDone }: { min: number; max: number; onDone: () => void }) {
  const [amount, setAmount] = useState(String(min));
  const [upi, setUpi] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      _amount: Number(amount),
      _upi: upi.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Withdrawal request submitted. Admin review ke baad payout hoga.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">
        Min {formatINR(min)} · Max {formatINR(max)} · ek time par sirf ek pending request.
      </p>
      <Input label="Amount (₹)" value={amount} onChange={setAmount} type="number" />
      <Input label="UPI ID" value={upi} onChange={setUpi} />
      <button
        disabled={busy}
        className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-gold-foreground disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Request withdrawal"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
