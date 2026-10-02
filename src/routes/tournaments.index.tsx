import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TournamentRow } from "@/components/TournamentCard";
import { useSlotCounts, useTournaments } from "@/lib/api";

export const Route = createFileRoute("/tournaments/")({
  head: () => ({
    meta: [
      { title: "Tournaments — Live, Upcoming & Completed | FireZone" },
      {
        name: "description",
        content: "Browse live, upcoming and completed esports tournaments with entry fees, prize pools and slots.",
      },
      { property: "og:title", content: "FireZone Tournaments" },
      { property: "og:description", content: "Live, upcoming and completed tournament listings." },
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
      <h1 className="font-display text-2xl font-bold">Tournaments</h1>

      <div className="mt-3 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {t.label}
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
