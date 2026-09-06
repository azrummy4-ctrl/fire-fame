import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/tournaments")({
  head: () => ({
    meta: [
      { title: "Manage Tournaments | FireZone Admin" },
      { name: "description", content: "Create tournaments, publish room IDs, enter results and distribute prizes." },
      { property: "og:title", content: "Manage Tournaments | FireZone Admin" },
      { property: "og:description", content: "Tournament creation, room publishing and result entry." },
    ],
  }),
  component: AdminTournaments,
});

const empty = {
  name: "",
  category: "BR FULL MAP",
  mode: "Squad",
  map: "Bermuda",
  entry_fee: "20",
  prize_pool: "1000",
  per_kill: "10",
  max_players: "48",
  starts_at: "",
};

function AdminTournaments() {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: list } = useQuery({
    queryKey: ["admin", "tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").order("starts_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("tournaments").insert({
      name: form.name,
      category: form.category,
      mode: form.mode,
      map: form.map,
      entry_fee: Number(form.entry_fee),
      prize_pool: Number(form.prize_pool),
      per_kill: Number(form.per_kill),
      max_players: Number(form.max_players),
      starts_at: new Date(form.starts_at).toISOString(),
      rules: ["Emulator not allowed", "No teaming", "Screenshot proof required"],
      prize_split: [
        { place: "1st", amount: Number(form.prize_pool) * 0.5 },
        { place: "2nd", amount: Number(form.prize_pool) * 0.3 },
        { place: "3rd", amount: Number(form.prize_pool) * 0.2 },
      ],
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tournament created");
    setForm(empty);
    qc.invalidateQueries();
  }

  return (
    <AdminShell>
      <form onSubmit={create} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-bold">Create tournament</h2>
        <F label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <div className="grid grid-cols-2 gap-2">
          <F label="Mode" value={form.mode} onChange={(v) => setForm({ ...form, mode: v })} />
          <F label="Map" value={form.map} onChange={(v) => setForm({ ...form, map: v })} />
          <F label="Entry fee" type="number" value={form.entry_fee} onChange={(v) => setForm({ ...form, entry_fee: v })} />
          <F label="Prize pool" type="number" value={form.prize_pool} onChange={(v) => setForm({ ...form, prize_pool: v })} />
          <F label="Per kill" type="number" value={form.per_kill} onChange={(v) => setForm({ ...form, per_kill: v })} />
          <F label="Max players" type="number" value={form.max_players} onChange={(v) => setForm({ ...form, max_players: v })} />
        </div>
        <F label="Starts at" type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
        <button className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground">
          Create
        </button>
      </form>

      <h2 className="mt-6 font-display text-lg font-bold">All tournaments</h2>
      <ul className="mt-2 space-y-2">
        {(list ?? []).map((t) => (
          <li key={t.id} className="rounded-2xl border border-border bg-surface p-3">
            <button
              type="button"
              onClick={() => setOpenId(openId === t.id ? null : t.id)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="font-display text-base font-bold">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateTime(t.starts_at)} · {t.status} · {formatINR(Number(t.entry_fee))} entry
                </p>
              </div>
              <span className="text-xs text-primary">{openId === t.id ? "Close" : "Manage"}</span>
            </button>
            {openId === t.id && <Manage tournamentId={t.id} roomPublished={t.room_published} resultsPublished={t.results_published} />}
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

function Manage({
  tournamentId,
  roomPublished,
  resultsPublished,
}: {
  tournamentId: string;
  roomPublished: boolean;
  resultsPublished: boolean;
}) {
  const qc = useQueryClient();
  const [roomId, setRoomId] = useState("");
  const [pass, setPass] = useState("");

  const { data: players } = useQuery({
    queryKey: ["admin", "participants", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("joined_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function publishRoom() {
    const { error } = await supabase.rpc("admin_publish_room", {
      _tournament_id: tournamentId,
      _room_id: roomId,
      _room_password: pass,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Room published, players notified");
    qc.invalidateQueries();
  }

  async function saveScore(id: string, patch: Partial<{ kills: number; placement: number; placement_points: number; bonus_points: number; prize_amount: number }>) {
    const { error } = await supabase.from("participants").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin", "participants", tournamentId] });
  }

  async function publishResults() {
    const { error } = await supabase.rpc("admin_publish_results", { _tournament_id: tournamentId });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Results published, prizes credited");
    qc.invalidateQueries();
  }

  async function removePlayer(id: string) {
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Player removed");
    qc.invalidateQueries({ queryKey: ["admin", "participants", tournamentId] });
  }

  return (
    <div className="mt-3 space-y-4 border-t border-border pt-3">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Room details {roomPublished && "(published)"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm"
          />
          <input
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={publishRoom}
          className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
        >
          Publish room & notify players
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Participants ({players?.length ?? 0})
        </p>
        {(players ?? []).map((p) => (
          <div key={p.id} className="rounded-lg bg-surface-2 p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">
                {p.ign} <span className="text-muted-foreground">· {p.ff_uid}</span>
              </p>
              <button type="button" onClick={() => removePlayer(p.id)} className="text-[10px] font-bold text-live">
                REMOVE
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1">
              <Num label="Kills" value={p.kills} onSave={(v) => saveScore(p.id, { kills: v })} />
              <Num label="Place" value={p.placement ?? 0} onSave={(v) => saveScore(p.id, { placement: v })} />
              <Num label="P.Pts" value={p.placement_points} onSave={(v) => saveScore(p.id, { placement_points: v })} />
              <Num label="Prize" value={Number(p.prize_amount)} onSave={(v) => saveScore(p.id, { prize_amount: v })} />
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={resultsPublished}
          onClick={publishResults}
          className="w-full rounded-lg bg-gold py-2 text-xs font-bold text-gold-foreground disabled:opacity-50"
        >
          {resultsPublished ? "Results published" : "Publish results & credit prizes"}
        </button>
      </div>
    </div>
  );
}

function Num({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <label className="block">
      <span className="text-[9px] uppercase text-muted-foreground">{label}</span>
      <input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => Number(v) !== value && onSave(Number(v))}
        className="w-full rounded border border-border bg-surface px-1.5 py-1 text-xs"
      />
    </label>
  );
}

function F({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
