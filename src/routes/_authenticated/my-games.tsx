import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR, useSession } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/my-games")({
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
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["my-games", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*, tournaments(*)")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">My Games</h1>

      {isLoading ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Abhi tak koi tournament join nahi kiya.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((p) => {
            const t = p.tournaments as unknown as {
              id: string;
              name: string;
              mode: string;
              map: string;
              starts_at: string;
              status: string;
              room_published: boolean;
            };
            return (
              <li key={p.id} className="card-elevated rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.mode} · {t.map} · {formatDateTime(t.starts_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold uppercase">
                    {t.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <Box label="Paid" value={formatINR(Number(p.paid_amount))} />
                  <Box label="Points" value={String(p.total_points)} />
                  <Box label="Prize" value={formatINR(Number(p.prize_amount))} />
                </div>
                <Link
                  to="/tournaments/$id"
                  params={{ id: t.id }}
                  className="mt-3 block rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground"
                >
                  {t.room_published ? "View room details" : "View tournament"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
