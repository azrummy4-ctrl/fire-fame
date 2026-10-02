import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
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
      {/* Banner */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <img
          src={bannerFor(t.banner_url)}
          alt={`${t.name} banner`}
          width={1088}
          height={608}
          className="h-40 w-full object-cover"
        />
      </div>

      {/* Time left countdown */}
      <Countdown startsAt={t.starts_at} status={t.status} />

      {/* Title */}
      <h1 className="mt-3 text-center font-display text-lg font-bold uppercase leading-snug text-primary">
        {t.name}
      </h1>

      {/* Info chips — Team / Mode / Map */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <InfoChip label="Team" value={t.mode} />
        <InfoChip label="Mode" value={t.category} />
        <InfoChip label="Map" value={t.map} />
      </div>

      {/* Match type + entry fee */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <InfoChip
          label="Match Type"
          value={Number(t.entry_fee) > 0 ? "Paid" : "Free"}
        />
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Entry Fee:</p>
          <p className="flex items-center justify-center gap-1 font-display text-lg font-bold text-gold">
            🪙 {formatINR(Number(t.entry_fee))}
          </p>
        </div>
      </div>

      {/* Match schedule */}
      <div className="mt-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-center text-sm">
        <span className="text-muted-foreground">Match Schedule: </span>
        <span className="font-bold">{formatDateTime(t.starts_at)}</span>
      </div>

      {/* Slots */}
      <div className="mt-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-center text-sm">
        <span className="text-muted-foreground">Slots: </span>
        <span className="font-bold">
          {joined}/{t.max_players} joined
        </span>
      </div>

      {/* Prize details */}
      <section className="mt-5">
        <h2 className="font-display text-lg font-bold text-primary">Prize Details</h2>
        <div className="mt-2 rounded-lg border border-border bg-surface p-3">
          <p className="font-display text-base font-bold uppercase text-gold">
            Prize pool {formatINR(Number(t.prize_pool))}
            {t.per_kill > 0 && ` + ${formatINR(Number(t.per_kill))} per kill`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {t.prize_split.map((p) => (
              <li
                key={p.place}
                className="flex items-center justify-between border-b border-border/60 pb-1.5 text-sm last:border-0 last:pb-0"
              >
                <span className="font-semibold">{p.place}</span>
                <span className="font-bold text-gold">{formatINR(Number(p.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rules and regulations */}
      <section className="mt-5">
        <h2 className="font-display text-lg font-bold text-primary">About this Match</h2>
        <div className="mt-2 rounded-lg border border-border bg-surface p-4">
          <h3 className="text-center font-display text-base font-bold">
            Rules and Regulations
          </h3>
          <div className="mx-auto mt-2 h-0.5 w-24 bg-border" />
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            {t.rules.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
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

      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={() => setShowPlayers((v) => !v)}
          className="w-full rounded-xl bg-gold py-3 text-sm font-bold uppercase tracking-wide text-gold-foreground"
        >
          View All Joinings
        </button>
        <button
          type="button"
          onClick={join}
          disabled={busy || alreadyJoined || t.status !== "upcoming"}
          className="w-full rounded-xl bg-success py-3.5 font-display text-base font-bold uppercase tracking-wide text-success-foreground disabled:opacity-50"
        >
          {alreadyJoined
            ? "Already Joined ✓"
            : t.status !== "upcoming"
              ? "Registration Closed"
              : busy
                ? "Joining…"
                : "Join Match"}
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}:</p>
      <p className="font-display text-base font-bold uppercase">{value}</p>
    </div>
  );
}

function Countdown({ startsAt, status }: { startsAt: string; status: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = new Date(startsAt).getTime() - now;
  let text: string;
  if (status === "live") text = "Match LIVE hai!";
  else if (status === "completed") text = "Match completed";
  else if (diff <= 0) text = "Starting…";
  else {
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    text = `${d}d ${h}h ${m}m ${s}s`;
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface py-3 text-center">
      <p className="font-display text-lg font-bold">
        Time Left: <span className="text-primary">{text}</span>
      </p>
    </div>
  );
}
