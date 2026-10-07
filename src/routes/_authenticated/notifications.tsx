import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { formatDateTime, useNotifications } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Room IDs, Results & Announcements | FireZone" },
      { name: "description", content: "Tournament announcements, room releases, results and wallet updates." },
      { property: "og:title", content: "Notifications | FireZone" },
      { property: "og:description", content: "Announcements, room releases and wallet updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, unreadCount, markAllRead } = useNotifications();
  const notifications = data ?? [];

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            Mark all read ({unreadCount})
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="mt-3 rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Abhi koi notification nahi. Room ID release, results aur wallet updates yahan aayenge.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border px-3 py-3 ${
                n.read ? "border-border bg-surface" : "border-primary/40 bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-2">
                {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                <p className="text-sm font-bold">{n.title}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
