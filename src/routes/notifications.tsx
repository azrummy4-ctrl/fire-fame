import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Room IDs, Results & Announcements | FireZone" },
      { name: "description", content: "Tournament announcements, room releases, results and wallet updates." },
      { property: "og:title", content: "Notifications | FireZone" },
      { property: "og:description", content: "Announcements, room releases and wallet updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Notifications</h1>
      <p className="mt-3 rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
        Abhi koi notification nahi. Room ID release, results aur wallet updates yahan aayenge.
      </p>
    </AppShell>
  );
}
