import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock, Users, Map as MapIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  bannerFor,
  formatDateTime,
  formatINR,
  useParticipants,
  useSession,
  useTournament,
} from "@/lib/api";

export const Route = createFileRoute("/tournaments/$id")({
  head: () => ({
    meta: [
      { title: "Tournament details | FireZone" },
      {
        name: "description",
        content: "Entry fee, prize pool, rules, slots, room details and leaderboard for this tournament.",
      },
      { property: "og:title", content: "Tournament details | FireZone" },
      { property: "og:description", content: "Prize pool, rules, room details and leaderboard." },
    ],
  }),
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  const { data: t, isLoading } = useTournament(id);
  const { data: participants } = useParticipants(id);
  const { session, user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);

  const alreadyJoined = !!participants?.some((p) => p.user_id === user?.id);
  const joined = participants?.length ?? 0;

  const { data: room } = useQuery({
    queryKey: ["room", id, user?.id],
    enabled: !!user && alreadyJoined && !!t?.room_published,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_room_details", { _tournament_id: id });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  async function join() {
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("join_tournament", { _tournament_id: id });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tournament joined! Entry fee wallet se deduct ho gayi.");
    qc.invalidateQueries();
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />
      </AppShell>
    );
  }
  if (!t) {
    return (
      <AppShell>
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm">
          Tournament not found.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border border-border">
        <img
          src={bannerFor(t.banner_url)}
          alt={`${t.name} banner`}
          width={1088}
          height={608}
          className="h-40 w-full object-cover"
        />
      </div>

      <h1 className="mt-3 font-display text-2xl font-bold">{t.name}</h1>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" /> {t.mode}
        </span>
        <span className="flex items-center gap-1">
          <MapIcon className="size-3.5" /> {t.map}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {formatDateTime(t.starts_at)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Prize pool" value={formatINR(Number(t.prize_pool))} gold />
        <Stat label="Entry" value={formatINR(Number(t.entry_fee))} />
        <Stat label="Slots" value={`${joined}/${t.max_players}`} />
      </div>

      <section className="mt-5">
        <h2 className="font-display text-lg font-bold">Prize distribution</h2>
        <ul className="mt-2 space-y-2">
          {t.prize_split.map((p) => (
            <li
              key={p.place}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="font-semibold">{p.place}</span>
              <span className="font-bold text-gold">{formatINR(Number(p.amount))}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="font-display text-lg font-bold">Rules</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {t.rules.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="text-primary">›</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Room details</h2>
          {!room && (
            <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold text-gold">
              <Lock className="size-3" /> LOCKED
            </span>
          )}
        </div>
        {room ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Room ID</p>
              <p className="font-bold tracking-wider">{room.room_id}</p>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Password</p>
              <p className="font-bold tracking-wider">{room.room_password}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Room ID aur password sirf joined players ko dikhte hain, admin ke publish karne ke baad.
          </p>
        )}
      </section>

      {t.results_published && (
        <section className="mt-5">
          <h2 className="font-display text-lg font-bold">Leaderboard</h2>
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Player</th>
                  <th className="px-2 py-2">Kills</th>
                  <th className="px-2 py-2">Pts</th>
                  <th className="px-2 py-2">Prize</th>
                </tr>
              </thead>
              <tbody>
                {(participants ?? []).map((p, i) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-2 py-2 font-bold">{i + 1}</td>
                    <td className="px-2 py-2">
                      <span className="font-semibold">{p.ign}</span>
                      <span className="block text-[10px] text-muted-foreground">{p.ff_uid}</span>
                    </td>
                    <td className="px-2 py-2">{p.kills}</td>
                    <td className="px-2 py-2 font-bold">{p.total_points}</td>
                    <td className="px-2 py-2 text-gold">{formatINR(Number(p.prize_amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={join}
          disabled={busy || alreadyJoined || t.status !== "upcoming"}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {alreadyJoined
            ? "Already joined"
            : t.status !== "upcoming"
              ? "Registration closed"
              : busy
                ? "Joining…"
                : `Join for ${formatINR(Number(t.entry_fee))}`}
        </button>
        <button
          type="button"
          onClick={() => setShowPlayers((v) => !v)}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold"
        >
          Players
        </button>
      </div>

      {showPlayers && (
        <ul className="mt-3 space-y-1.5">
          {(participants ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs"
            >
              <span className="font-semibold">{p.ign}</span>
              <span className="text-muted-foreground">UID {p.ff_uid}</span>
            </li>
          ))}
          {(participants ?? []).length === 0 && (
            <li className="rounded-lg border border-border bg-surface px-3 py-4 text-center text-xs text-muted-foreground">
              Abhi koi player join nahi hua.
            </li>
          )}
        </ul>
      )}

      <Link to="/tournaments" className="mt-4 block text-center text-xs font-semibold text-primary">
        ← All tournaments
      </Link>
    </AppShell>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="card-elevated rounded-xl border border-border py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-bold ${gold ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}
