import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Megaphone, RefreshCw, CalendarDays, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { TournamentTile } from "@/components/TournamentCard";
import { DEPOSIT_BONUSES } from "@/lib/deposit-bonus";
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

function HomeBanners() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % 2), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Featured offers" className="mt-4">
      <div className="relative h-44 overflow-hidden rounded-lg border border-primary/40 bg-surface">
        <div aria-hidden={active !== 0} className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${active === 0 ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}>
          <img src={promoBanner} alt="Join daily tournaments" width={1200} height={688} className="h-full w-full object-cover" />
          <Link to="/tournaments" tabIndex={active === 0 ? 0 : -1} className="absolute bottom-3 left-3 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            More details
          </Link>
        </div>
        <div aria-hidden={active !== 1} className={`absolute inset-0 overflow-hidden bg-surface-2 p-3 transition-opacity duration-500 motion-reduce:transition-none ${active === 1 ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold leading-none text-foreground">FIREZONE <span className="text-gold">DEPOSIT BONUS</span></h2>
            <Link to="/add-money" tabIndex={active === 1 ? 0 : -1} className="shrink-0 rounded-md bg-success px-2.5 py-1.5 text-xs font-bold text-primary-foreground">Add Money</Link>
          </div>
          <table className="mt-3 w-full table-fixed text-center text-sm font-bold tabular-nums">
            <thead className="bg-background text-[11px] text-muted-foreground"><tr><th className="py-1">Deposit</th><th>Coins</th><th>Bonus</th><th>Total</th></tr></thead>
            <tbody>{DEPOSIT_BONUSES.map(({ deposit, bonus }) => (
              <tr key={deposit} className="border-t border-border/50 odd:bg-surface even:bg-surface-2">
                <td className="py-1">₹{deposit}</td><td>{deposit}</td><td className="text-gold">+{bonus}</td><td className="text-success">{deposit + bonus}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-2" aria-label="Choose banner">
        {[0, 1].map((index) => (
          <Button key={index} type="button" variant="ghost" size="icon" aria-label={`Banner ${index + 1}`} aria-current={active === index ? "true" : undefined} onClick={() => setActive(index)} className="size-6 rounded-full p-0">
            <span className={`size-2 rounded-full ${active === index ? "bg-primary" : "bg-muted-foreground"}`} />
          </Button>
        ))}
      </div>
    </section>
  );
}

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

      <HomeBanners />

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
