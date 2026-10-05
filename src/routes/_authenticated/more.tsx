import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Gift, LifeBuoy, LogOut, ScrollText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useIsHost, useProfile, useSession } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({
    meta: [
      { title: "More — Profile & Settings | FireZone" },
      { name: "description", content: "Manage your in-game name, Free Fire UID, referral code and account settings." },
      { property: "og:title", content: "More | FireZone" },
      { property: "og:description", content: "Your player profile, referrals and account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MorePage,
});

const SUPPORT_URL = "https://t.me/XpiralSoftware";

const rows: ReadonlyArray<{ label: string; icon: typeof Gift; to?: string; external?: boolean }> = [
  { label: "Referral & rewards", icon: Gift, to: "/earn" },
  { label: "Support", icon: LifeBuoy, to: SUPPORT_URL, external: true },
  { label: "Terms, Privacy & Refund policy", icon: ScrollText },
  { label: "Responsible gaming", icon: ShieldCheck },
];

function MorePage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: isHost } = useIsHost();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [ign, setIgn] = useState("");
  const [ffUid, setFfUid] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setIgn(profile.ign ?? "");
      setFfUid(profile.ff_uid ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ign: ign.trim(), ff_uid: ffUid.trim(), phone: phone.trim(), updated_at: new Date().toISOString() })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function copyReferral() {
    if (!profile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">More</h1>

      <div className="card-elevated mt-3 flex items-center gap-3 rounded-2xl border border-border p-4">
        <span className="grid size-14 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
          {(profile?.ign ?? "P").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{profile?.ign ?? "Player"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">
            UID {profile?.ff_uid || "not linked"} · Status {profile?.status}
          </p>
        </div>
      </div>

      <form onSubmit={save} className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-bold">Game details</h2>
        <Input label="In-game name" value={ign} onChange={setIgn} />
        <Input label="Free Fire UID" value={ffUid} onChange={setFfUid} />
        <Input label="Mobile number" value={phone} onChange={setPhone} required={false} />
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Your referral code</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-display text-2xl font-bold tracking-widest text-gold">
            {profile?.referral_code ?? "—"}
          </p>
          {profile?.referral_code && (
            <button
              type="button"
              onClick={copyReferral}
              aria-label="Copy referral code"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-primary"
            >
              <Copy className="size-3.5" /> Copy
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <a
          href="/admin"
          className="mt-4 block rounded-xl bg-gold py-3 text-center text-sm font-bold text-gold-foreground"
        >
          Open Admin Panel
        </a>
      )}
      {(isHost || isAdmin) && (
        <a
          href="/host"
          className="mt-3 block rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
        >
          Open Host Dashboard
        </a>
      )}

      <ul className="mt-5 space-y-2">
        {rows.map(({ label, icon: Icon, to, external }) => (
          <li key={label}>
            {to ? (
              <a
                href={to}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-semibold"
              >
                <Icon className="size-4.5 text-primary" />
                {label}
              </a>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-semibold">
                <Icon className="size-4.5 text-primary" />
                {label}
              </div>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={signOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-3 text-sm font-bold text-live"
      >
        <LogOut className="size-4" /> Sign out
      </button>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Entry fees, prizes aur withdrawals region config se enable/disable kiye ja sakte hain.
      </p>
    </AppShell>
  );
}

function Input({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
