import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side gate for public routes that must require registration first.
 * Redirects to /auth when there is no session. Use with `ssr: false` so the
 * server never prerenders gated content.
 */
export async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw redirect({ to: "/auth" });
  return { user: data.session.user };
}
