import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BellRing, Coins, Gift, Home, Menu, Trophy, Wallet, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { formatINR, useIsAdmin, useNotifications, useSession, useWallet } from "@/lib/api";
import { enablePush } from "@/lib/push";
import firezoneLogo from "@/assets/firezone-logo.png.asset.json";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/earn", label: "Earn", icon: Gift },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/more", label: "More", icon: Menu },
] as const;

const PUSH_DISMISS_KEY = "fz_push_prompt_dismissed";

function PushPrompt() {
  const { session } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!session || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(PUSH_DISMISS_KEY) === "1") return;
    setShow(true);
  }, [session]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(PUSH_DISMISS_KEY, "1");
    setShow(false);
  };

  const turnOn = async () => {
    const result = await enablePush();
    if (result.status === "registered") {
      toast.success("Notifications on! 🎉", {
        description: "Room ID, results aur wallet updates turant milenge.",
      });
    } else if (result.status === "denied") {
      toast.error("Permission block hai", {
        description: "Browser settings me is site ke notifications allow karein.",
      });
    } else if (result.status === "open-in-new-tab") {
      toast("Naye tab me kholein", {
        description: "Notifications enable karne ke liye app ko apne tab me kholkar try karein.",
      });
    } else if (result.status === "not-configured") {
      toast.error("Abhi available nahi", { description: "Thodi der baad phir try karein." });
    }
    localStorage.setItem(PUSH_DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-primary/40 bg-surface-2 px-3 py-2.5">
      <BellRing className="size-5 shrink-0 text-primary" />
      <p className="flex-1 text-xs leading-snug">
        <span className="font-bold">Match alerts on karein</span>
        <span className="block text-muted-foreground">
          Room ID, results aur wallet updates turant paayein.
        </span>
      </p>
      <button
        onClick={turnOn}
        className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
      >
        Turn on
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 p-1 text-muted-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useSession();
  const { data: wallet } = useWallet();
  const { data: isAdmin } = useIsAdmin();
  const { unreadCount } = useNotifications();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
      <header className="app-header-gradient sticky top-0 z-30 rounded-b-2xl px-4 pb-3 pt-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src={firezoneLogo.url}
                alt="FireZone logo"
                width={40}
                height={40}
                className="size-10 rounded-full"
              />
              <span className="font-display text-2xl font-bold tracking-wide">FireZone</span>
            </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Admin panel"
                className="grid size-9 place-items-center rounded-full bg-surface-2 text-gold"
              >
                <ShieldCheck className="size-4.5" />
              </Link>
            )}
            <Link
              to={session ? "/wallet" : "/auth"}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3"
            >
              <span className="grid size-6 place-items-center rounded-full bg-gold text-gold-foreground">
                <Coins className="size-3.5" />
              </span>
              <span className="text-sm font-semibold">
                {session ? formatINR(Number(wallet?.balance ?? 0)) : "Sign in"}
              </span>
            </Link>
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-full bg-surface-2 text-primary"
            >
              <Bell className="size-4.5" />
              {!!unreadCount && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="app-header-gradient fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] rounded-t-2xl border-t border-border">
        <ul className="grid grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                  <span
                    className={`h-0.5 w-6 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
