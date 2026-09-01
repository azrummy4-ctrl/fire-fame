import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TournamentRow } from "@/components/TournamentCard";
import { tournaments } from "@/data/tournaments";

export const Route = createFileRoute("/my-games")({
  head: () => ({
    meta: [
      { title: "My Games — Joined Tournaments | FireZone" },
      { name: "description", content: "Track your joined tournaments, room details and match results." },
      { property: "og:title", content: "My Games | FireZone" },
      { property: "og:description", content: "Your joined tournaments and results in one place." },
    ],
  }),
  component: MyGames,
});

function MyGames() {
  const joined = tournaments.filter((t) => t.status === "live");

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">My Games</h1>
      <p className="text-xs text-muted-foreground">Sign-in ke baad yahan aapke joined matches dikhenge.</p>

      <div className="mt-4 space-y-4">
        {joined.map((t) => (
          <TournamentRow key={t.id} tournament={t} />
        ))}
      </div>
    </AppShell>
  );
}
