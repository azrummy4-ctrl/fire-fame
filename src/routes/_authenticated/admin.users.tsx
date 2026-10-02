import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Account Status | FireZone Admin" },
      { name: "description", content: "Search players by name or Free Fire UID and manage account status." },
      { property: "og:title", content: "Users | FireZone Admin" },
      { property: "og:description", content: "Player search, UID lookup and ban/unban controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (users ?? []).filter(
    (u) =>
      !q ||
      (u.ign ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.ff_uid ?? "").includes(q),
  );

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Account ${status}`);
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  return (
    <AdminShell>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or Free Fire UID"
        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <ul className="mt-3 space-y-2">
        {filtered.map((u) => (
          <li key={u.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{u.ign ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">
                  UID {u.ff_uid ?? "—"} · {u.phone ?? "no phone"}
                </p>
              </div>
              <span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold uppercase">{u.status}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["active", "suspended", "banned"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(u.id, s)}
                  disabled={u.status === s}
                  className="rounded-lg bg-surface-2 py-1.5 text-[11px] font-bold capitalize disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
            Koi user nahi mila.
          </li>
        )}
      </ul>
    </AdminShell>
  );
}
