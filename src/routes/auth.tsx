import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/api";
import { lovable } from "@/integrations/lovable";
import firezoneLogo from "@/assets/firezone-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Register | FireZone Tournaments" },
      {
        name: "description",
        content: "Create your FireZone account with your Free Fire UID and in-game name to join tournaments.",
      },
      { property: "og:title", content: "Sign in | FireZone" },
      { property: "og:description", content: "Login or register to join daily esports tournaments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ign, setIgn] = useState("");
  const [ffUid, setFfUid] = useState("");
  const [phone, setPhone] = useState("");
  const [refCode, setRefCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRefCode(r.toUpperCase());
  }, []);

  useEffect(() => {
    if (!session || profileLoading) return;
    if (!profile || !profile.ff_uid || !profile.ign) {
      navigate({ to: "/profile", replace: true });
      return;
    }
    navigate({ to: "/", replace: true });
  }, [session, profile, profileLoading, navigate]);

  async function continueWithGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // Session changes are handled above; Gmail selection alone is never treated as login.
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in nahi ho paya.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        if (!ign.trim() || !ffUid.trim()) throw new Error("In-game name and Free Fire UID required");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { ign: ign.trim(), ff_uid: ffUid.trim(), phone: phone.trim(), ref_code: refCode.trim().toUpperCase() },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account ban gaya! Welcome to FireZone 🔥");
          navigate({ to: "/", replace: true });
        } else {
          setSent(true);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2.5 self-center">
        <img
          src={firezoneLogo.url}
          alt="FireZone logo"
          width={44}
          height={44}
          className="size-11 rounded-full"
        />
        <span className="font-display text-3xl font-bold tracking-wide">FireZone</span>
      </Link>

      <h1 className="text-center font-display text-2xl font-bold">
        {mode === "login" ? "Sign in to play" : mode === "register" ? "Create your player account" : "Reset your password"}
      </h1>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Tournaments join karne ke liye Free Fire UID aur in-game name zaroori hai.
      </p>

      <div className={`mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1 ${mode === "forgot" ? "hidden" : ""}`}>
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-sm font-bold ${
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "login" ? "Login" : "Register"}
          </button>
        ))}
      </div>

      {!sent && mode !== "forgot" && (
        <Button
          type="button"
          variant="outline"
          onClick={continueWithGoogle}
          disabled={busy}
          className="google-sign-in-button mt-4 h-11 w-full rounded-md px-3 text-sm font-medium"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
          </svg>
          {mode === "login" ? "Sign in with Google" : "Continue with Google"}
        </Button>
      )}
      {!sent && mode !== "forgot" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Gmail choose karne ke baad secure sign-in complete hoga; phir profile details maangi ja sakti hain.
        </p>
      )}

      {sent ? (
        <div className="card-elevated mt-5 rounded-xl border border-border p-5 text-center text-sm">
          {mode === "forgot" ? (
            <p>
              Password reset link <b>{email}</b> pe bhej diya hai. Email me link click karke naya
              password set karein.
            </p>
          ) : (
            <p>
              Account ban gaya hai <b>{email}</b> ke liye. Ab <b>Login</b> tab se sign in karein.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMode("login");
            }}
            className="mt-3 font-bold text-primary"
          >
            ← Wapas login pe jao
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <Field label="Email" value={email} onChange={setEmail} type="email" required />
          {mode !== "forgot" && (
            <Field label="Password" value={password} onChange={setPassword} type="password" required />
          )}
          {mode === "register" && (
            <>
              <Field label="In-game name (IGN)" value={ign} onChange={setIgn} required />
              <Field label="Free Fire UID" value={ffUid} onChange={setFfUid} required />
              <Field label="Mobile number (optional)" value={phone} onChange={setPhone} type="tel" />
              <Field label="Referral code (optional)" value={refCode} onChange={setRefCode} />
            </>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Login"
                : mode === "register"
                  ? "Create account"
                  : "Send reset link"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="w-full text-center text-xs font-semibold text-primary"
            >
              Forgot password?
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-center text-xs font-semibold text-muted-foreground"
            >
              ← Wapas login pe jao
            </button>
          )}
        </form>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Continue karke aap Terms, Privacy Policy aur responsible gaming rules accept karte hain. FireZone
        Garena / Free Fire se affiliated nahi hai.
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
