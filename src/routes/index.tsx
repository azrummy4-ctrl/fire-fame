import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Megaphone, RefreshCw, CalendarDays, CheckSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TournamentTile } from "@/components/TournamentCard";
import { hiddenCategories, homeGameCatalog, useIsAdmin, useSlotCounts, useTournaments } from "@/lib/api";
import { requireSession } from "@/lib/auth-gate";
import promoBanner from "@/assets/promo-banner.jpg";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: requireSession,
  head: () => ({
    meta: [
      { title: "FireZone — Daily Free Fire Tournaments & Prizes" },
      {
        name: "description",
        content:
          "Join daily Free Fire style esports tournaments, track room details, leaderboards and wallet rewards in one app.",
      },
      { property: "og:title", content: "FireZone — Daily Free Fire Tournaments" },
      {
        property: "og:description",
        content: "Browse live and upcoming tournaments, join matches and follow results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const matchShortcuts = [
  { label: "Ongoing", icon: RefreshCw, tone: "bg-success" },
  { label: "Upcoming", icon: CalendarDays, tone: "bg-primary" },
  { label: "Completed", icon: CheckSquare, tone: "bg-gold" },
] as const;

function Home() {
  const { data: tournaments, isLoading } = useTournaments();
  const { data: counts } = useSlotCounts();
  const { data: isAdmin } = useIsAdmin();

  // Keep all reference game modes visible even before an admin creates their first contest.
  const tournamentGames = (tournaments ?? []).filter(
    (t, i, arr) =>
      !hiddenCategories.has(t.category.trim().toUpperCase()) &&
      arr.findIndex((x) => x.category === t.category) === i
  );
  const games = [
    ...homeGameCatalog.map((game) => ({ ...game, id: `catalog-${game.category}` })),
    ...tournamentGames.filter((t) => !homeGameCatalog.some((game) => game.category.toLowerCase() === t.category.toLowerCase())),
  ];
  const joinedByCategory = (tournaments ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + (counts?.[t.id] ?? 0);
    return acc;
  }, {});

  return (
    <AppShell>
      <h1 className="sr-only">FireZone tournaments</h1>

      <div className="flex items-stretch gap-3 rounded-xl border border-border bg-surface p-2">
        <span className="grid w-14 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">
          <Megaphone className="size-6" />
        </span>
        <p className="line-clamp-2 self-center text-sm font-semibold leading-snug">
          Rules update: har player ko apna POV / screen recording rakhna zaroori hai.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-primary/40">
        <div className="relative">
          <img
            src={promoBanner}
            alt="Join daily tournaments promotional banner"
            width={1200}
            height={688}
            className="h-44 w-full object-cover"
          />
          <Link
            to="/tournaments"
            className="absolute bottom-3 left-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            More details
          </Link>
        </div>
      </div>

      <h2 className="mt-6 text-center font-display text-2xl font-bold">My Matches</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {matchShortcuts.map(({ label, icon: Icon, tone }) => (
          <Link
            key={label}
            to="/my-games"
            className="card-elevated flex flex-col items-center gap-2 rounded-xl border border-border py-3"
          >
            <span className={`grid size-11 place-items-center rounded-xl ${tone} text-primary-foreground`}>
              <Icon className="size-6" />
            </span>
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Esports Games</h2>
        <Link to="/tournaments" className="text-xs font-semibold text-primary">
          See all
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {games.map((t) => (
              <div key={t.id} className="relative">
                <TournamentTile tournament={t} joined={joinedByCategory[t.category] ?? 0} />
                {isAdmin && (
                  <Link
                    to="/admin/tournaments"
                    search={{ category: t.category }}
                    aria-label={`${t.category} me naya tournament add karein`}
                    className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  >
                    <Plus className="size-5" />
                  </Link>
                )}
              </div>
            ))}
        {isAdmin && !isLoading && (
          <Link
            to="/admin/tournaments"
            className="flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-surface text-primary"
          >
            <span className="grid size-11 place-items-center rounded-full bg-primary/15">
              <Plus className="size-6" />
            </span>
            <span className="text-sm font-bold">Add Tournament</span>
            <span className="text-[10px] text-muted-foreground">Admin only</span>
          </Link>
        )}
      </div>
    </AppShell>
  );
}
