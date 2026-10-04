import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, useSession } from "@/lib/api";

type Period = "weekly" | "monthly" | "overall";

const PERIODS: { key: Period; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "overall", label: "Overall" },
];

function cutoffFor(period: Period): string | null {
  if (period === "overall") return null;
  const days = period === "weekly" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Top Players | FireZone" },
      { name: "description", content: "Top 25 FireZone players ranked by total winnings." },
      { property: "og:title", content: "Leaderboard | FireZone" },
      { property: "og:description", content: "Top 25 FireZone players ranked by total winnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

type Player = { user_id: string; ign: string; winnings: number };

function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = (name || "P").trim().charAt(0).toUpperCase();
  return (
    <div
      className={`grid place-items-center rounded-full border-2 border-border bg-surface-2 font-display font-bold text-muted-foreground ${className ?? ""}`}
    >
      {initial}
    </div>
  );
}

function WinningsPill({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-display text-xs font-bold text-gold">
      <Medal className="size-3" />
      {formatINR(amount)}
    </span>
  );
}

function LeaderboardPage() {
  const { user } = useSession();
  const [period, setPeriod] = useState<Period>("overall");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-winnings", period],
    queryFn: async () => {
      const cutoff = cutoffFor(period);
      let query = supabase
        .from("participants")
        .select("user_id, ign, prize_amount")
        .gt("prize_amount", 0);
      if (cutoff) query = query.gte("joined_at", cutoff);
      const { data, error } = await query;
      if (error) throw error;
      const totals = new Map<string, Player>();
      for (const row of data ?? []) {
        const existing = totals.get(row.user_id);
        if (existing) {
          existing.winnings += Number(row.prize_amount);
        } else {
          totals.set(row.user_id, {
            user_id: row.user_id,
            ign: row.ign || "Player",
            winnings: Number(row.prize_amount),
          });
        }
      }
      return [...totals.values()].sort((a, b) => b.winnings - a.winnings).slice(0, 25);
    },
  });

  const players = data ?? [];
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);
  const myRank = user ? players.findIndex((p) => p.user_id === user.id) : -1;
  const me = myRank >= 0 ? players[myRank] : null;

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Trophy className="size-6 text-gold" />
        <h1 className="font-display text-2xl font-bold">Top Players</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Top 25 players by total winnings</p>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-full border border-border bg-surface p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`rounded-full py-2 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
              period === p.key
                ? "border border-primary bg-primary/15 text-primary"
                : "text-muted-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}

      {data && players.length === 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-center">
          <Trophy className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-display font-bold">No winners yet</p>
          <p className="text-xs text-muted-foreground">
            Jab prizes distribute honge, yahan top earners dikhenge.
          </p>
        </div>
      )}

      {players.length > 0 && (
        <>
          {/* Top 3 podium */}
          <div className="mt-6 grid grid-cols-3 items-end gap-2">
            {/* #2 */}
            <div className="flex flex-col items-center gap-1.5 pt-8">
              {top3[1] ? (
                <>
                  <div className="relative">
                    <Avatar name={top3[1].ign} className="size-16 text-xl" />
                    <span className="absolute -bottom-2 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-full bg-surface-2 font-display text-xs font-bold text-foreground ring-2 ring-background">
                      2
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-full truncate font-display text-sm font-bold">{top3[1].ign}</p>
                  <WinningsPill amount={top3[1].winnings} />
                </>
              ) : (
                <div className="size-16 rounded-full border border-dashed border-border" />
              )}
            </div>
            {/* #1 */}
            <div className="flex flex-col items-center gap-1.5">
              <Crown className="size-7 fill-gold text-gold" />
              <div className="relative">
                <Avatar name={top3[0]?.ign ?? "P"} className="size-20 border-gold text-2xl text-gold" />
                <span className="absolute -bottom-2 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-full bg-gold font-display text-xs font-bold text-gold-foreground ring-2 ring-background">
                  1
                </span>
              </div>
              <p className="mt-1.5 max-w-full truncate font-display text-base font-bold">{top3[0]?.ign}</p>
              <WinningsPill amount={top3[0]?.winnings ?? 0} />
            </div>
            {/* #3 */}
            <div className="flex flex-col items-center gap-1.5 pt-10">
              {top3[2] ? (
                <>
                  <div className="relative">
                    <Avatar name={top3[2].ign} className="size-14 text-lg" />
                    <span className="absolute -bottom-2 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-full bg-surface-2 font-display text-xs font-bold text-live ring-2 ring-background">
                      3
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-full truncate font-display text-sm font-bold">{top3[2].ign}</p>
                  <WinningsPill amount={top3[2].winnings} />
                </>
              ) : (
                <div className="size-14 rounded-full border border-dashed border-border" />
              )}
            </div>
          </div>

          {/* Ranks 4–25 */}
          <div className="mt-6 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-16">Rank</span>
            <span className="flex-1">Player</span>
            <span>Winnings</span>
          </div>
          <ul className="mt-2 space-y-2">
            {rest.map((p, i) => (
              <li
                key={p.user_id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  p.user_id === user?.id ? "border-gold/50 bg-gold/5" : "border-border bg-surface"
                }`}
              >
                <span className="w-10 font-display text-sm font-bold text-muted-foreground">#{i + 4}</span>
                <Avatar name={p.ign} className="size-9 text-sm" />
                <p className="min-w-0 flex-1 truncate font-display text-sm font-bold">
                  {p.ign}
                  {p.user_id === user?.id && <span className="text-gold"> (You)</span>}
                </p>
                <WinningsPill amount={p.winnings} />
              </li>
            ))}
          </ul>

          {/* Your rank footer */}
          {user && (
            <div className="sticky bottom-20 mt-4 flex items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 px-4 py-3 backdrop-blur">
              <span className="grid size-10 place-items-center rounded-full bg-gold/20 font-display text-sm font-bold text-gold">
                {me ? `#${myRank + 1}` : "—"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">Your rank</p>
                <p className="truncate font-display text-sm font-bold">
                  {me ? `You (${me.ign})` : "You · not ranked yet"}
                </p>
              </div>
              <WinningsPill amount={me?.winnings ?? 0} />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
