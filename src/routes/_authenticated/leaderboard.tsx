import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Skull, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Top Players | FireZone" },
      { name: "description", content: "Top FireZone players ranked by tournament points and kills." },
      { property: "og:title", content: "Leaderboard | FireZone" },
      { property: "og:description", content: "Top FireZone players ranked by tournament points and kills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

type Row = { ign: string; ff_uid: string; kills: number; total_points: number };

function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("ign, ff_uid, kills, total_points")
        .gt("total_points", 0)
        .order("total_points", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Trophy className="size-6 text-gold" />
        <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Top players by tournament points</p>

      {isLoading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-center">
          <Trophy className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-display font-bold">No results yet</p>
          <p className="text-xs text-muted-foreground">Jab hi results publish honge, yahan top players dikhenge.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.map((row, i) => (
            <li
              key={`${row.ff_uid}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
                  i === 0
                    ? "bg-gold text-gold-foreground"
                    : i === 1
                      ? "bg-surface-2 text-foreground"
                      : i === 2
                        ? "bg-surface-2 text-live"
                        : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {i === 0 ? <Crown className="size-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold">{row.ign || "Player"}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.ff_uid ? `UID ${row.ff_uid}` : "—"}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Skull className="size-3.5" />
                {row.kills ?? 0}
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 font-display text-sm font-bold text-gold">
                <Medal className="size-3.5" />
                {row.total_points ?? 0}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
