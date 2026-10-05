import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TournamentRow } from "@/components/TournamentCard";
import { useSlotCounts, useTournaments } from "@/lib/api";
import { requireSession } from "@/lib/auth-gate";

export const Route = createFileRoute("/games/$category")({
  ssr: false,
  beforeLoad: requireSession,
  head: ({ params }) => {
    const name = decodeURIComponent(params.category);
    return {
      meta: [
        { title: `${name} Contests — FireZone` },
        {
          name: "description",
          content: `All ${name} tournaments — live, upcoming and resulted contests with entry fees and prize pools.`,
        },
        { property: "og:title", content: `${name} Contests — FireZone` },
        { property: "og:description", content: `Browse ${name} tournaments and join matches.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: GameContestsPage,
});

const tabs = [
  { key: "live", label: "Ongoing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Resulted" },
] as const;

function GameContestsPage() {
  const { category } = Route.useParams();
  const name = decodeURIComponent(category);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("upcoming");
  const { data, isLoading } = useTournaments();
  const { data: counts } = useSlotCounts();

  const list = (data ?? []).filter(
    (t) => t.category.toLowerCase() === name.toLowerCase() && t.status === tab
  );

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Link
          to="/"
          aria-label="Back to home"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-xl font-bold uppercase tracking-wide">
          {name} Contests
        </h1>
        <span className="size-9 shrink-0" aria-hidden />
      </div>

      <div className="mt-3 grid grid-cols-3 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative pb-2.5 pt-1 text-center text-sm font-semibold ${
              tab === t.key ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
        ) : list.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No {tab} {name} contests right now. Check back soon.
          </p>
        ) : (
          list.map((t) => <TournamentRow key={t.id} tournament={t} joined={counts?.[t.id] ?? 0} />)
        )}
      </div>
    </AppShell>
  );
}
