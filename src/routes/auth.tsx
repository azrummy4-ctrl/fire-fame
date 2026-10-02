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
  const [mode, setMode] = useState<"login" | "register">("login");
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
      if (mode === "login") {
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
        if (!data.session) {
          setSent(true);
          toast.success("Account banaya! Email confirm karke login karein.");
        } else {
          navigate({ to: "/", replace: true });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    // Managed by Lovable — no Google Cloud credentials needed.
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
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
        {mode === "login" ? "Sign in to play" : "Create your player account"}
      </h1>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Tournaments join karne ke liye Free Fire UID aur in-game name zaroori hai.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1">
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
        <p className="card-elevated mt-5 rounded-xl border border-border p-5 text-center text-sm">
          Confirmation email bheja gaya hai <b>{email}</b> par. Link click karke wapas aakar login karein.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <Field label="Email" value={email} onChange={setEmail} type="email" required />
          <Field label="Password" value={password} onChange={setPassword} type="password" required />
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
            {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      )}

      <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={google}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3 text-sm font-bold text-gray-800 shadow-md transition active:scale-[0.98]"
      >
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.2 14.4c-.25-.75-.4-1.55-.4-2.4s.15-1.65.42-2.4l-.01-.16-3.65-2.83-.12.06C.52 8.2 0 10 0 12s.52 3.8 1.44 5.3l3.76-2.9z"
          />
          <path
            fill="#EA4335"
            d="M12 4.6c2.3 0 3.8.97 4.7 1.8l3.4-3.3C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.44 6.7l3.77 2.9c1-2.9 3.6-5 6.79-5z"
          />
        </svg>
        Continue with Google
      </button>

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
