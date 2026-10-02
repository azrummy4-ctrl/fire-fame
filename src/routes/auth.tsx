import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/api";

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
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ign, setIgn] = useState("");
  const [ffUid, setFfUid] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

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
        navigate({ to: "/", replace: true });
      } else {
        if (!ign.trim() || !ffUid.trim()) throw new Error("In-game name and Free Fire UID required");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { ign: ign.trim(), ff_uid: ffUid.trim(), phone: phone.trim() },
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
        <span className="grid size-11 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
          FZ
        </span>
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
