import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, LifeBuoy, ScrollText, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Free Fire UID & Settings | FireZone" },
      { name: "description", content: "Manage your in-game name, Free Fire UID, referral code and account settings." },
      { property: "og:title", content: "Profile | FireZone" },
      { property: "og:description", content: "Your player profile, referrals and account settings." },
    ],
  }),
  component: ProfilePage,
});

const rows = [
  { label: "Referral & rewards", icon: Gift },
  { label: "Support", icon: LifeBuoy },
  { label: "Terms, Privacy & Refund policy", icon: ScrollText },
  { label: "Responsible gaming", icon: ShieldCheck },
] as const;

function ProfilePage() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Profile</h1>

      <div className="card-elevated mt-3 flex items-center gap-3 rounded-2xl border border-border p-4">
        <span className="grid size-14 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
          G
        </span>
        <div>
          <p className="font-display text-lg font-bold">Guest Player</p>
          <p className="text-xs text-muted-foreground">Free Fire UID not linked yet</p>
        </div>
      </div>

      <Link
        to="/"
        className="mt-3 block rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
      >
        Sign in / Register
      </Link>

      <ul className="mt-5 space-y-2">
        {rows.map(({ label, icon: Icon }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-semibold"
          >
            <Icon className="size-4.5 text-primary" />
            {label}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Entry fees, prizes and withdrawals region-wise config se enable/disable kiye ja sakte hain.
      </p>
    </AppShell>
  );
}
