import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/data/tournaments";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Balance, Deposits & Withdrawals | FireZone" },
      { name: "description", content: "Check your tournament wallet balance, deposits, prizes and withdrawal history." },
      { property: "og:title", content: "Wallet | FireZone" },
      { property: "og:description", content: "Balance, transactions and withdrawal requests." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Wallet</h1>

      <div className="card-elevated mt-3 rounded-2xl border border-border p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Available balance</p>
        <p className="font-display text-3xl font-bold text-gold">{formatINR(0)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
          >
            <ArrowDownLeft className="size-4" /> Add Money
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-2.5 text-sm font-bold"
          >
            <ArrowUpRight className="size-4" /> Withdraw
          </button>
        </div>
      </div>

      <h2 className="mt-6 font-display text-lg font-bold">Transactions</h2>
      <p className="mt-2 rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
        Abhi koi transaction nahi hai. Payments aur withdrawals backend setup ke baad enable honge.
      </p>
    </AppShell>
  );
}
