import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

// Admin-only: sabhi registered devices ko push bhejo (title, message, banner, click URL).
export const broadcastPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        title: z.string().trim().min(1).max(100),
        body: z.string().trim().min(1).max(500),
        image: z.string().url().max(1000).optional().or(z.literal("")),
        link: z.string().max(500).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const connectionApiKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (!LOVABLE_API_KEY || !connectionApiKey) throw new Error("Push setup missing");

    let link = data.link || "/notifications";
    if (link.startsWith("/")) link = `https://fire-fame.lovable.app${link}`;
    if (!/^https:\/\//.test(link)) throw new Error("Link https:// ya / se shuru hona chahiye");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("push_tokens").select("token");
    if (error) throw new Error(error.message);
    const tokens = Array.from(new Set((rows ?? []).map((r) => r.token as string)));

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": connectionApiKey,
      "Content-Type": "application/json",
    };
    let sent = 0;
    const stale: string[] = [];
    for (const token of tokens) {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: data.title,
                body: data.body,
                ...(data.image ? { image: data.image } : {}),
              },
              data: { url: link, kind: "broadcast" },
              android: { priority: "high" },
              webpush: {
                headers: { Urgency: "high" },
                notification: data.image ? { image: data.image } : {},
                fcm_options: { link },
              },
            },
          }),
        });
        if (res.ok) {
          sent++;
          continue;
        }
        const txt = await res.text();
        console.error(`broadcast FCM failed [${res.status}]: ${txt}`);
        if (res.status === 404 || txt.includes("UNREGISTERED") || txt.includes("INVALID_ARGUMENT")) stale.push(token);
      } catch (e) {
        console.error("broadcast error", e);
      }
    }
    if (stale.length) await supabaseAdmin.from("push_tokens").delete().in("token", stale);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "push_broadcast",
      target: data.title,
      meta: { sent, total: tokens.length, link },
    } as never);

    return { sent, total: tokens.length };
  });
