import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TournamentRow } from "@/components/TournamentCard";
import { useSlotCounts, useTournaments } from "@/lib/api";
import { requireSession } from "@/lib/auth-gate";

export const Route = createFileRoute("/tournaments/")({
  ssr: false,
  beforeLoad: requireSession,
  head: () => ({
    meta: [
      { title: "Tournaments — Live, Upcoming & Completed | FireZone" },
      {
        name: "description",
        content: "Browse live, upcoming and completed esports tournaments with entry fees, prize pools and slots.",
      },
      { property: "og:title", content: "FireZone Tournaments" },
      { property: "og:description", content: "Live, upcoming and completed tournament listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TournamentsPage,
});

const tabs = [
  { key: "live", label: "Ongoing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Resulted" },
] as const;

function TournamentsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("upcoming");
  const { data, isLoading } = useTournaments();
  const { data: counts } = useSlotCounts();
  const list = (data ?? []).filter((t) => t.status === tab);

  return (
    <AppShell>
      <h1 className="text-center font-display text-2xl font-bold tracking-wide">
        FireZone Contests
      </h1>

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
            No {tab} tournaments right now. Check back soon.
          </p>
        ) : (
          list.map((t) => <TournamentRow key={t.id} tournament={t} joined={counts?.[t.id] ?? 0} />)
        )}
      </div>
    </AppShell>
  );
}
