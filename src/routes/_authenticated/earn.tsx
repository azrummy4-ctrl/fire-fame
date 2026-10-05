import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Gift, Share2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR, useProfile, useSession } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/earn")({
  head: () => ({
    meta: [
      { title: "Earn — Referral & Rewards | FireZone" },
      { name: "description", content: "Earn rewards on FireZone: refer friends, win tournaments and prizes." },
      { property: "og:title", content: "Earn | FireZone" },
      { property: "og:description", content: "Earn rewards on FireZone: refer friends, win tournaments and prizes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EarnPage,
});

type Txn = { id: string; type: string; amount: number; note: string | null; created_at: string };

function EarnPage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const [copied, setCopied] = useState(false);

  const { data: rewards } = useQuery({
    queryKey: ["earn-rewards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount, note, created_at")
        .eq("user_id", user!.id)
        .in("type", ["referral_reward", "prize"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Txn[];
    },
  });

  const total = (rewards ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const referralCode = profile?.referral_code ?? "";
  const shareUrl = referralCode ? `https://firezone.live/auth?ref=${referralCode}` : "";

  async function shareApp() {
    const message = `Free Fire khelte ho? FireZone par tournament khelo aur coins jeeto! Mera referral code: ${referralCode}`;
    // APK (WebView) bridge: Android app me native share sheet kholta hai
    const bridge = (window as unknown as { AndroidShare?: { share: (t: string) => void } }).AndroidShare;
    if (bridge?.share) {
      bridge.share(`${message}\n${shareUrl || window.location.origin}`);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "FireZone — Free Fire Tournaments",
          text: message,
          url: shareUrl || window.location.origin,
        });
        return;
      } catch (err) {
        // User closed the share sheet — do nothing.
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    // Fallback: copy the referral link to the clipboard.
    copy(shareUrl || message, "Referral link");
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${what} copied!`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy nahi hua, manually copy karo");
    }
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Gift className="size-6 text-gold" />
        <h1 className="font-display text-2xl font-bold">Earn</h1>
      </div>

      <div className="card-elevated mt-3 rounded-2xl border border-border bg-gradient-to-br from-primary/15 to-transparent p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total earnings</p>
        <p className="font-display text-3xl font-bold text-gold">{formatINR(total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Prize + referral rewards, wallet me direct credit</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <Users className="size-4.5 text-primary" />
          <h2 className="font-display text-lg font-bold">Refer & earn</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Apna referral code dosto ko bhejo — jab dost register karke pehli baar Add Money karega, aapko upto ₹10 per refer milega.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your code</p>
            <p className="font-display text-xl font-bold tracking-widest text-gold">
              {referralCode || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => referralCode && copy(referralCode, "Code")}
            className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            disabled={!referralCode}
            aria-label="Copy referral code"
          >
            <Copy className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={() => shareUrl && copy(shareUrl, "Referral link")}
            className="grid size-11 place-items-center rounded-xl bg-gold text-gold-foreground disabled:opacity-50"
            disabled={!shareUrl}
            aria-label="Copy referral link"
          >
            <Share2 className="size-4.5" />
          </button>
        </div>
          <button
            type="button"
            onClick={shareApp}
            disabled={!referralCode}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Share2 className="size-4.5" />
            Share Now
          </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <Trophy className="size-5 text-gold" />
          <p className="mt-1.5 font-display text-sm font-bold">Win tournaments</p>
          <p className="text-[11px] text-muted-foreground">Match jeeto, prize wallet me</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <Users className="size-5 text-primary" />
          <p className="mt-1.5 font-display text-sm font-bold">Invite friends</p>
          <p className="text-[11px] text-muted-foreground">Upto ₹10 per refer</p>
        </div>
      </div>

      <h2 className="mt-5 font-display text-lg font-bold">Recent rewards</h2>
      {!rewards && (
        <div className="mt-2 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}
      {rewards && rewards.length === 0 && (
        <p className="mt-2 rounded-xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
          Abhi koi reward nahi mila. Tournament khelo aur dosto ko refer karo!
        </p>
      )}
      <ul className="mt-2 space-y-2">
        {(rewards ?? []).map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize">{t.type.replace("_", " ")}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {formatDateTime(t.created_at)}
                {t.note ? ` · ${t.note}` : ""}
              </p>
            </div>
            <span className="font-display text-sm font-bold text-success">+{formatINR(Number(t.amount))}</span>
          </li>
        ))}
      </ul>

      {copied && <p className="sr-only">copied</p>}
    </AppShell>
  );
}
