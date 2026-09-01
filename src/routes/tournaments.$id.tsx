import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Lock, Users, Map as MapIcon, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatINR, getTournament } from "@/data/tournaments";

export const Route = createFileRoute("/tournaments/$id")({
  loader: ({ params }) => {
    const tournament = getTournament(params.id);
    if (!tournament) throw notFound();
    return { tournament };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Tournament unavailable | FireZone" }, { name: "robots", content: "noindex" }] };
    }
    const { tournament } = loaderData;
    const description = `${tournament.mode} on ${tournament.map} · Prize pool ${formatINR(tournament.prizePool)} · Entry ${formatINR(tournament.entryFee)}.`;
    return {
      meta: [
        { title: `${tournament.name} | FireZone` },
        { name: "description", content: description },
        { property: "og:title", content: tournament.name },
        { property: "og:description", content: description },
      ],
    };
  },
  errorComponent: () => (
    <AppShell>
      <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm">
        Tournament load nahi ho paya. Thodi der baad try karein.
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm">Tournament not found.</p>
    </AppShell>
  ),
  component: TournamentDetail,
});

function TournamentDetail() {
  const { tournament } = Route.useLoaderData();

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border border-border">
        <img
          src={tournament.banner}
          alt={`${tournament.name} banner`}
          width={1088}
          height={608}
          className="h-40 w-full object-cover"
        />
      </div>

      <h1 className="mt-3 font-display text-2xl font-bold">{tournament.name}</h1>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" /> {tournament.mode}
        </span>
        <span className="flex items-center gap-1">
          <MapIcon className="size-3.5" /> {tournament.map}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {tournament.startsAt}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="card-elevated rounded-xl border border-border py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prize pool</p>
          <p className="font-bold text-gold">{formatINR(tournament.prizePool)}</p>
        </div>
        <div className="card-elevated rounded-xl border border-border py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entry</p>
          <p className="font-bold">{formatINR(tournament.entryFee)}</p>
        </div>
        <div className="card-elevated rounded-xl border border-border py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Slots</p>
          <p className="font-bold">
            {tournament.joined}/{tournament.maxPlayers}
          </p>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="font-display text-lg font-bold">Prize distribution</h2>
        <ul className="mt-2 space-y-2">
          {tournament.prizeSplit.map((p) => (
            <li
              key={p.place}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="font-semibold">{p.place}</span>
              <span className="font-bold text-gold">{formatINR(p.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="font-display text-lg font-bold">Rules</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {tournament.rules.map((rule) => (
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
          {!tournament.roomPublished && (
            <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold text-gold">
              <Lock className="size-3" /> LOCKED
            </span>
          )}
        </div>
        {tournament.roomPublished ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Room ID</p>
              <p className="font-bold tracking-wider">{tournament.roomId}</p>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Password</p>
              <p className="font-bold tracking-wider">{tournament.roomPassword}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Room ID and password admin ke publish karne par yahin dikhenge, match se thodi der pehle.
          </p>
        )}
      </section>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
        >
          Join Tournament
        </button>
        <Link
          to="/tournaments"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold"
        >
          Back
        </Link>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Joining, payments and prizes activate after the backend setup step.
      </p>
    </AppShell>
  );
}
