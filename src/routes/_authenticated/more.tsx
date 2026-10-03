import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProfile, useSession } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({
    meta: [
      { title: "More — Account | FireZone" },
      { name: "description", content: "Your FireZone account settings and profile." },
      { property: "og:title", content: "More | FireZone" },
      { property: "og:description", content: "Your FireZone account settings and profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  const { user } = useSession();
  const { data: profile } = useProfile();

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">More</h1>

      <Link
        to="/profile"
        className="card-elevated mt-3 flex items-center gap-3 rounded-2xl border border-border p-4"
      >
        <span className="grid size-12 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
          {(profile?.ign ?? "P").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold">{profile?.ign ?? "Player"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email ?? "Sign in to manage your profile"}
          </p>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      <Link
        to="/profile"
        className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-semibold"
      >
        <User className="size-4.5 text-primary" />
        Profile
        <ChevronRight className="ml-auto size-4.5 text-muted-foreground" />
      </Link>
    </AppShell>
  );
}
