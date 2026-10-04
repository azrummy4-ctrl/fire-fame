import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Clock, Headphones, IndianRupee, Loader2, ShieldCheck, Sparkles, Volume2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { formatINR, useSession, useWallet } from "@/lib/api";
import { createDepositOrder, verifyDepositPayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/add-money")({
  head: () => ({
    meta: [
      { title: "Add Money — Secure UPI Deposit | FireZone" },
      { name: "description", content: "Add money to your FireZone wallet instantly via UPI." },
      { property: "og:title", content: "Add Money | FireZone" },
      { property: "og:description", content: "Add money to your FireZone wallet instantly via UPI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddMoneyPage,
});

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

function AddMoneyPage() {
  const { user } = useSession();
  const { data: wallet } = useWallet();
  const [amount, setAmount] = useState("50");
  const [payBusy, setPayBusy] = useState(false);
  const createOrder = useServerFn(createDepositOrder);
  const verify = useServerFn(verifyDepositPayment);
  const navigate = useNavigate();
  const [pay, setPay] = useState<{ orderId: string; url: string } | null>(null);

  // Payment window khula rahe tab tak har 2 sec status check — success/fail hote hi turant wallet
  useEffect(() => {
    if (!pay) return;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const r = await verify({ data: { orderId: pay.orderId } });
        if (!stop && r.status !== "pending") {
          stop = true;
          navigate({ to: "/wallet", search: { deposit_order: pay.orderId } as never });
          return;
        }
      } catch {
        /* ignore, retry */
      }
      if (!stop) setTimeout(tick, 2000);
    };
    const t = setTimeout(tick, 2000);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [pay, verify, navigate]);

  const amt = Number(amount) || 0;

  async function payOnline() {
    if (!amt || amt < 10) {
      toast.error("Minimum deposit ₹10 hai.");
      return;
    }
    setPayBusy(true);
    try {
      // Client origin bhejo taaki payment ke baad isi origin ke /wallet par wapas aaye
      const res = await createOrder({ data: { amount: amt, origin: window.location.origin } });
      setPay({ orderId: res.orderId, url: res.paymentUrl });
      setPayBusy(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment start nahi ho paya.");
      setPayBusy(false);
    }
  }

  if (pay) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Loader2 className="size-4 animate-spin text-primary" /> Payment complete karo…
          </span>
        </div>
        <iframe src={pay.url} title="Payment" className="w-full flex-1 border-0 bg-white" allow="payment" />
        <a href={pay.url} className="border-t border-border py-2 text-center text-xs text-muted-foreground">
          Page nahi khul raha? Yahan tap karo
        </a>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-full border border-border bg-surface p-1.5"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Add Money</h1>
      </div>

      {/* Header card */}
      <div className="card-elevated mt-3 flex items-center justify-between rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-gold/15">
            <IndianRupee className="size-6 text-gold" />
          </div>
          <div>
            <p className="font-display text-lg font-bold">Select the amount</p>
            <p className="text-xs text-muted-foreground">Choose any amount to add coins</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</p>
          <p className="font-display text-sm font-bold text-gold">{formatINR(Number(wallet?.balance ?? 0))}</p>
        </div>
      </div>

      {/* Quick amount chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(String(a))}
            className={`min-w-16 rounded-xl border px-4 py-2.5 font-display text-base font-bold transition-colors ${
              amt === a
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            ₹{a}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <label className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-lg font-bold text-primary">
          ₹
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Amount</span>
          <input
            type="number"
            min={10}
            max={50000}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-transparent font-display text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
          />
        </span>
      </label>

      {/* Pay now */}
      <button
        type="button"
        onClick={payOnline}
        disabled={payBusy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-display text-lg font-bold tracking-wide text-primary-foreground disabled:opacity-60"
      >
        {payBusy ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
        {payBusy ? "Payment khol raha hai…" : "PAY NOW"}
      </button>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" /> 100% Secure Payment · UPI
      </p>

      {/* Secure banner */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-success" />
          <span className="font-display text-base font-bold text-success">100% SECURE</span>
        </div>
        <span className="text-xs text-success/90">Safe · Fast · Reliable</span>
      </div>

      {/* How to */}
      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <p className="font-display text-base font-bold">How To Add Coins with Us?</p>
        <ul className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Do not press back during payment.
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="mt-0.5 size-4 shrink-0 text-primary" /> No hidden charges.
          </li>
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Wait till the payment gets confirmed.
          </li>
          <li className="flex items-start gap-2">
            <Volume2 className="mt-0.5 size-4 shrink-0 text-live" /> Instant confirmation on successful payment.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Payment is 100% secure.
          </li>
          <li className="flex items-start gap-2">
            <Headphones className="mt-0.5 size-4 shrink-0 text-success" /> Contact support for any issues with
            transactions.
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" /> Minimum deposit ₹10 hai.
          </li>
          <li className="flex items-start gap-2">
            <IndianRupee className="mt-0.5 size-4 shrink-0 text-gold" /> Sirf ZapUpi verified payment hi wallet me
            add hota hai.
          </li>
        </ul>
      </div>

      {!user && <p className="mt-3 text-center text-xs text-muted-foreground">Login required.</p>}
    </AppShell>
  );
}
