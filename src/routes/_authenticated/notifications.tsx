import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, useSession } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/notifications")({
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
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Notifications</h1>
      {(data ?? []).length === 0 ? (
        <p className="mt-3 rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Abhi koi notification nahi. Room ID release, results aur wallet updates yahan aayenge.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(data ?? []).map((n) => (
            <li key={n.id} className="rounded-xl border border-border bg-surface px-3 py-3">
              <p className="text-sm font-bold">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
