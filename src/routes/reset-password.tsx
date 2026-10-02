import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | FireZone Tournaments" },
      { name: "description", content: "Set a new password for your FireZone account." },
      { property: "og:title", content: "Reset Password | FireZone" },
      { property: "og:description", content: "Set a new password for your FireZone account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Recovery link lands here with type=recovery in the URL hash.
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isRecovery) setReady(true);
      else if (!isRecovery && !data.session) setInvalid(true);
      else if (data.session) setReady(true);
      else if (isRecovery) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords match nahi kar rahe");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password update ho gaya! Ab login karein.");
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2.5 self-center">
        <span className="grid size-11 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
          FZ
        </span>
        <span className="font-display text-3xl font-bold tracking-wide">FireZone</span>
      </Link>

      <h1 className="text-center font-display text-2xl font-bold">Set new password</h1>

      {invalid ? (
        <div className="card-elevated mt-5 rounded-xl border border-border p-5 text-center text-sm">
          <p>Ye reset link invalid ya expire ho gaya hai.</p>
          <Link to="/auth" className="mt-3 inline-block font-bold text-primary">
            Wapas login page pe jao →
          </Link>
        </div>
      ) : !ready ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">Link verify ho raha hai…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              New password
            </span>
            <input
              type="password"
              value={password}
              required
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confirm password
            </span>
            <input
              type="password"
              value={confirm}
              required
              minLength={6}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
