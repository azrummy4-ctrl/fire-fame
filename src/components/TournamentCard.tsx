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
      to="/tournaments/$id"
      params={{ id: tournament.id }}
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

export function TournamentRow({ tournament, joined = 0 }: { tournament: Tournament; joined?: number }) {
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
          className="h-32 w-full object-cover"
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
        <h3 className="font-display text-lg font-bold">{tournament.name}</h3>
        <p className="text-xs text-muted-foreground">
          {tournament.mode} · {tournament.map} · {formatDateTime(tournament.starts_at)}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-2 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prize</p>
            <p className="text-sm font-bold text-gold">{formatINR(Number(tournament.prize_pool))}</p>
          </div>
          <div className="rounded-lg bg-surface-2 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Per kill</p>
            <p className="text-sm font-bold">{formatINR(Number(tournament.per_kill))}</p>
          </div>
          <div className="rounded-lg bg-surface-2 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entry</p>
            <p className="text-sm font-bold">{formatINR(Number(tournament.entry_fee))}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Joined</span>
            <span>
              {joined}/{tournament.max_players}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} />
          </div>
        </div>

        <Link
          to="/tournaments/$id"
          params={{ id: tournament.id }}
          className="mt-3 block rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground"
        >
          {tournament.status === "completed" ? "View Results" : "View Details"}
        </Link>
      </div>
    </article>
  );
}
