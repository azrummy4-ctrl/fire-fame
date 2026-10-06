import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { HostShell } from "@/components/HostShell";
import { supabase } from "@/integrations/supabase/client";
import { bannerFor, categoryBannerKey, formatDateTime, formatINR, hiddenCategories, homeBannerFor, homeGameCatalog, isOldCompleted } from "@/lib/api";
import { rulesFor } from "@/lib/tournament-rules";
import { tournamentModes } from "@/lib/tournament-mode";

export const Route = createFileRoute("/_authenticated/admin/tournaments")({
  head: () => ({
    meta: [
      { title: "Manage Tournaments | FireZone Admin" },
      { name: "description", content: "Create tournaments, publish room IDs, enter results and distribute prizes." },
      { property: "og:title", content: "Manage Tournaments | FireZone Admin" },
      { property: "og:description", content: "Tournament creation, room publishing and result entry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { category?: string | undefined } => ({
    category: typeof s['category'] === "string" ? s['category'] : undefined,
  }),
  component: () => <AdminTournaments />,
});

export async function uploadBanner(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Sirf image file upload karein");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image 5MB se chhoti honi chahiye");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("banners").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage
    .from("banners")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("URL nahi bana");
  return data.signedUrl;
}

function BannerPicker({ value, category, onChange }: { value: string; category?: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="block cursor-pointer">
      <span className="text-[11px] font-semibold text-muted-foreground">Banner image</span>
      <div className="mt-1 grid h-32 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-surface-2 text-xs text-muted-foreground">
        {busy ? "Uploading..." : value ? <img src={bannerFor(value, category)} alt="Banner preview" className="h-full w-full object-cover" /> : "Tap to upload image"}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadBanner(f));
            toast.success("Image upload ho gayi");
          } catch (err) {
            toast.error((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

const empty = {
  name: "",
  category: "BR FULL MAP",
  mode: "Squad",
  map: "Bermuda",
  entry_fee: "20",
  prize_pool: "1000",
  booyah: "500",
  per_kill: "10",
  max_players: "48",
  starts_at: "",
  banner_url: categoryBannerKey("BR FULL MAP") ?? "",
  rules: rulesFor("BR FULL MAP").join("\n"),
};

function freshForm(category: string) {
  return {
    ...empty,
    category,
    banner_url: categoryBannerKey(category) ?? "",
    rules: rulesFor(category).join("\n"),
  };
}

export function AdminTournaments({ host = false }: { host?: boolean }) {
  const qc = useQueryClient();
  const search = useSearch({ strict: false }) as { category?: string };
  const [form, setForm] = useState(() => freshForm(search.category ?? empty.category));
  const [openId, setOpenId] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("ALL");

  const { data: list } = useQuery({
    queryKey: ["admin", "tournaments", host],
    queryFn: async () => {
      let q = supabase.from("tournaments").select("*").order("starts_at");
      if (host) {
        const { data: u } = await supabase.auth.getUser();
        q = q.eq("created_by", u.user?.id ?? "");
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Category dropdown ke liye sab tournaments ki categories (host ko bhi saari dikheni chahiye)
  const { data: allCategories } = useQuery({
    queryKey: ["admin", "tournament-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("category");
      if (error) throw error;
      return (data ?? []).map((t) => t.category);
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("tournaments").insert({
      created_by: u.user?.id ?? null,
      name: form.name,
      category: form.category.trim().toUpperCase(),
      banner_url: form.banner_url || categoryBannerKey(form.category),
      mode: form.mode,
      map: form.map,
      entry_fee: Number(form.entry_fee),
      prize_pool: Number(form.prize_pool),
      per_kill: Number(form.per_kill),
      max_players: Number(form.max_players),
      starts_at: new Date(form.starts_at).toISOString(),
      rules: form.rules.split("\n").map((r) => r.trim()).filter(Boolean),
      prize_split: (() => {
        const pool = Number(form.prize_pool);
        const booyah = Math.min(Math.max(0, Number(form.booyah) || 0), pool);
        const rest = pool - booyah;
        return [
          { place: "1st", amount: booyah },
          { place: "2nd", amount: Math.round(rest * 0.6 * 100) / 100 },
          { place: "3rd", amount: Math.round(rest * 0.4 * 100) / 100 },
        ];
      })(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tournament created");
    setForm(freshForm(form.category));
    qc.invalidateQueries();
  }

  const Shell = host ? HostShell : AdminShell;
  return (
    <Shell>
      <form onSubmit={create} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-bold">Create tournament</h2>
        <BannerPicker value={form.banner_url} category={form.category} onChange={(v) => setForm({ ...form, banner_url: v })} />
        <F label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <CategoryPicker
          value={form.category}
          onChange={(v) => setForm({
            ...form,
            category: v,
            banner_url: categoryBannerKey(v) ?? "",
            rules: rulesFor(v).join("\n"),
          })}
          existing={allCategories ?? []}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</span>
            <select
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {tournamentModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <F label="Map" value={form.map} onChange={(v) => setForm({ ...form, map: v })} />
          <F label="Entry fee" type="number" value={form.entry_fee} onChange={(v) => setForm({ ...form, entry_fee: v })} />
          <F label="Prize pool" type="number" value={form.prize_pool} onChange={(v) => setForm({ ...form, prize_pool: v })} />
          <F label="Booyah prize (1st)" type="number" value={form.booyah} onChange={(v) => setForm({ ...form, booyah: v })} />
          <F label="Per kill" type="number" value={form.per_kill} onChange={(v) => setForm({ ...form, per_kill: v })} />
          <F label="Max players" type="number" value={form.max_players} onChange={(v) => setForm({ ...form, max_players: v })} />
        </div>
        <F label="Starts at" type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
        <RulesBox value={form.rules} onChange={(v) => setForm({ ...form, rules: v })} />
        <button className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground">
          Create
        </button>
      </form>

      <h2 className="mt-6 font-display text-lg font-bold">{host ? "Mere tournaments" : "All tournaments"}</h2>
      {(() => {
        // 24 ghante se purane resulted tournaments list se chhupa do (data DB me safe rehta hai).
        const all = (list ?? []).filter((t) => !isOldCompleted(t as never));
        const groups = new Map<string, typeof all>();
        for (const t of all) {
          const c = (t.category || "OTHER").trim().toUpperCase();
          groups.set(c, [...(groups.get(c) ?? []), t]);
        }
        const cats = [...groups.keys()];
        const shown = catFilter === "ALL" ? cats : cats.filter((c) => c === catFilter);
        return (
          <>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {["ALL", ...cats].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatFilter(c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${catFilter === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground"}`}
                >
                  {c === "ALL" ? "All" : c} ({c === "ALL" ? all.length : groups.get(c)?.length})
                </button>
              ))}
            </div>
            {all.length === 0 && (
              <p className="mt-2 rounded-2xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">Abhi koi tournament nahi.</p>
            )}
            {shown.map((cat) => (
              <section key={cat} className="mt-4">
                <div className="flex items-center gap-2">
                  <img src={homeBannerFor(cat)} alt="" className="size-8 rounded-lg object-cover" />
                  <h3 className="font-display text-sm font-bold tracking-wide">{cat}</h3>
                  <span className="rounded-full bg-surface-2 px-2 text-[10px] font-bold text-muted-foreground">{groups.get(cat)?.length}</span>
                </div>
      <ul className="mt-2 space-y-2">
        {(groups.get(cat) ?? []).map((t) => (
          <li key={t.id} className="rounded-2xl border border-border bg-surface p-3">
            <button
              type="button"
              onClick={() => setOpenId(openId === t.id ? null : t.id)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="font-display text-base font-bold">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.mode} · {formatDateTime(t.starts_at)} · {t.status} · {formatINR(Number(t.entry_fee))} entry
                </p>
              </div>
              <span className="text-xs text-primary">{openId === t.id ? "Close" : "Manage"}</span>
            </button>
            {openId === t.id && (
              <div className="mt-3 space-y-3">
                <BannerPicker
                  value={t.banner_url?.startsWith("http") ? t.banner_url : ""}
                  onChange={async (url) => {
                    const { error } = await supabase.from("tournaments").update({ banner_url: url }).eq("id", t.id);
                    if (error) toast.error(error.message);
                    else qc.invalidateQueries();
                  }}
                />
                <BooyahEditor tournamentId={t.id} prizeSplit={(t.prize_split as { place: string; amount: number }[]) ?? []} />
                <RulesEditor tournamentId={t.id} initialRules={t.rules ?? []} />
              </div>
            )}
            {openId === t.id && <Manage host={host} tournamentId={t.id} roomPublished={t.room_published} resultsPublished={t.results_published} />}
          </li>
        ))}
      </ul>
              </section>
            ))}
          </>
        );
      })()}
    </Shell>
  );
}

function Manage({
  host,
  tournamentId,
  roomPublished,
  resultsPublished,
}: {
  host: boolean;
  tournamentId: string;
  roomPublished: boolean;
  resultsPublished: boolean;
}) {
  const qc = useQueryClient();
  const [roomId, setRoomId] = useState("");
  const [pass, setPass] = useState("");
  const pendingSaves = useRef(new Set<Promise<void>>());

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

  function saveScore(id: string, patch: Partial<{ kills: number; placement: number; placement_points: number; bonus_points: number; prize_amount: number }>) {
    const p = (async () => {
      const { error } = await supabase.from("participants").update(patch).eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ["admin", "participants", tournamentId] });
    })();
    pendingSaves.current.add(p);
    p.finally(() => pendingSaves.current.delete(p));
    return p;
  }

  async function publishResults() {
    // Pehle typed prize/kills save hone do, warna prize credit nahi hota.
    (document.activeElement as HTMLElement | null)?.blur();
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all([...pendingSaves.current]);
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
              {!host && <button type="button" onClick={() => removePlayer(p.id)} className="text-[10px] font-bold text-live">
                REMOVE
              </button>}
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

function CategoryPicker({
  value,
  onChange,
  existing,
}: {
  value: string;
  onChange: (v: string) => void;
  existing: string[];
}) {
  // Home page ki saari categories + pehle se bani categories, bina duplicate (hidden categories hata kar).
  const options = [...new Set([...homeGameCatalog.map((g) => g.category), ...existing])].filter(
    (c) => !hiddenCategories.has(c.trim().toUpperCase())
  );
  const isKnown = options.some((o) => o.toLowerCase() === value.trim().toLowerCase());
  const [custom, setCustom] = useState(!isKnown && value.trim() !== "");

  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Game / Category
      </span>
      <select
        value={custom ? "__custom__" : value}
        onChange={(e) => {
          if (e.target.value === "__custom__") {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value="__custom__">+ Nayi category likhein…</option>
      </select>
      {custom && (
        <input
          value={value}
          required
          placeholder="Nayi category ka naam (e.g. DUO CLASH)"
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      )}
      <p className="mt-1 text-[10px] text-muted-foreground">
        Jo category chunoge, tournament Home page pe usi game card ke andar dikhega.
      </p>
    </div>
  );
}

function RulesBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Rules (har line me ek rule)
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={"Emulator not allowed\nNo teaming\nScreenshot proof required"}
        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function BooyahEditor({ tournamentId, prizeSplit }: { tournamentId: string; prizeSplit: { place: string; amount: number }[] }) {
  const qc = useQueryClient();
  const first = prizeSplit.find((p) => p.place === "1st") ?? prizeSplit[0];
  const [v, setV] = useState(String(first?.amount ?? 0));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const amount = Math.max(0, Number(v) || 0);
    const rest = prizeSplit.filter((p) => p !== first);
    const split = [{ place: "1st", amount }, ...rest];
    const { error } = await supabase.from("tournaments").update({ prize_split: split }).eq("id", tournamentId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booyah prize save ho gaya");
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Booyah prize (1st place coins)
        </span>
        <input
          type="number"
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="w-full rounded-lg bg-gold py-2 text-xs font-bold text-gold-foreground disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Booyah prize"}
      </button>
    </div>
  );
}

function RulesEditor({ tournamentId, initialRules }: { tournamentId: string; initialRules: string[] }) {
  const qc = useQueryClient();
  const [text, setText] = useState(initialRules.join("\n"));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const rules = text.split("\n").map((r) => r.trim()).filter(Boolean);
    const { error } = await supabase.from("tournaments").update({ rules }).eq("id", tournamentId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rules save ho gaye");
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-2">
      <RulesBox value={text} onChange={setText} />
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save rules"}
      </button>
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
