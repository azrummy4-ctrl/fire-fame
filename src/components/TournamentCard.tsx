import { Link } from "@tanstack/react-router";
import { bannerFor, formatDateTime, formatINR, type Tournament } from "@/lib/api";

const statusLabel: Record<string, string> = {
  live: "LIVE",
  upcoming: "UPCOMING",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

const statusClass: Record<string, string> = {
  live: "bg-live text-foreground",
  upcoming: "bg-primary text-primary-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-gold text-gold-foreground",
};

export function TournamentTile({ tournament, joined = 0 }: { tournament: Tournament; joined?: number }) {
  return (
    <Link
      to="/games/$category"
      params={{ category: tournament.category }}
      className="card-elevated block overflow-hidden rounded-xl border border-border"
    >
      <img
        src={bannerFor(tournament.banner_url)}
        alt={`${tournament.name} banner`}
        loading="lazy"
        width={1088}
        height={608}
        className="h-24 w-full object-cover"
      />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-sm font-semibold">{tournament.category}</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <span className="size-2 rounded-full bg-success" />
          {joined}
        </span>
      </div>
    </Link>
  );
}

function CoinStat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 flex items-center justify-center gap-1 text-base font-extrabold ${gold ? "text-gold" : ""}`}>
        <span aria-hidden>🪙</span>
        {value}
      </p>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-base font-bold uppercase leading-tight">{value}</p>
    </div>
  );
}

export function TournamentRow({ tournament, joined = 0 }: { tournament: Tournament; joined?: number }) {
  const left = Math.max(0, tournament.max_players - joined);
  const full = left === 0;
  const fill = Math.min(100, Math.round((joined / tournament.max_players) * 100));

  return (
    <article className="card-elevated overflow-hidden rounded-2xl border border-border">
      <div className="relative">
        <img
          src={bannerFor(tournament.banner_url)}
          alt={`${tournament.name} banner`}
          loading="lazy"
          width={1088}
          height={608}
          className="h-36 w-full object-cover"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest ${
            statusClass[tournament.status] ?? "bg-muted"
          }`}
        >
          {statusLabel[tournament.status] ?? tournament.status.toUpperCase()}
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="font-display text-lg font-bold uppercase leading-snug">
          {tournament.name} 😈⚔️
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Time : {formatDateTime(tournament.starts_at)}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <CoinStat label="Prize Pool" value={formatINR(Number(tournament.prize_pool))} gold />
          <CoinStat label="Per Kill" value={formatINR(Number(tournament.per_kill))} />
          <CoinStat label="Entry Fee" value={formatINR(Number(tournament.entry_fee))} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <MetaStat label="Type" value={tournament.category} />
          <MetaStat label="Entry per player" value={formatINR(Number(tournament.entry_fee))} />
          <MetaStat label="Map" value={tournament.map} />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full ${full ? "bg-live" : "bg-primary"}`}
                style={{ width: `${fill}%` }}
              />
            </div>
            <p className={`mt-1 text-[11px] font-semibold ${full ? "text-live" : "text-muted-foreground"}`}>
              Only {left} Spot Left {joined}/{tournament.max_players}
            </p>
          </div>
          {tournament.status === "completed" ? (
            <Link
              to="/tournaments/$id"
              params={{ id: tournament.id }}
              className="rounded-xl bg-surface-2 px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Results
            </Link>
          ) : full ? (
            <span className="cursor-not-allowed rounded-xl bg-primary/50 px-5 py-2.5 text-sm font-bold text-primary-foreground">
              Joining Full
            </span>
          ) : (
            <Link
              to="/tournaments/$id"
              params={{ id: tournament.id }}
              className="rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-success-foreground"
            >
              Join Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
