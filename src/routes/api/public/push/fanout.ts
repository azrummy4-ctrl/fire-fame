import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Firebase se call hone wala endpoint nahi hai — ye database trigger (pg_net) se call hota hai
// jab bhi kisi user ke liye naya notification banta hai. Shared secret se verify karo.
const fanoutPayload = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string(),
  kind: z.string().optional(),
});

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export const Route = createFileRoute("/api/public/push/fanout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-push-secret");
        const expected = process.env["PUSH_FANOUT_SECRET"];
        if (!expected || !secret || secret.length !== expected.length || secret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const parsed = fanoutPayload.safeParse(raw);
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const notification = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows, error } = await supabaseAdmin
          .from("push_tokens")
          .select("token")
          .eq("user_id", notification.user_id);
        if (error) {
          console.error("push fanout token fetch failed:", error.message);
          return Response.json({ sent: 0 }, { status: 200 });
        }
        const tokens = (rows ?? []).map((r) => r.token as string);
        if (tokens.length === 0) return Response.json({ sent: 0 });

        const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
        const connectionApiKey = process.env["FIREBASE_MESSAGING_API_KEY"];
        if (!LOVABLE_API_KEY || !connectionApiKey) {
          console.error("push fanout: gateway credentials missing");
          return Response.json({ sent: 0 }, { status: 200 });
        }

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": connectionApiKey,
          "Content-Type": "application/json",
        };

        let sent = 0;
        const staleTokens: string[] = [];
        for (const token of tokens) {
          try {
            const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                message: {
                  token,
                  notification: { title: notification.title, body: notification.body },
                  data: {
                    kind: notification.kind ?? "info",
                    notification_id: notification.id,
                  },
                },
              }),
            });
            if (res.ok) {
              sent += 1;
              continue;
            }
            const body = await res.text();
            console.error(`FCM send failed [${res.status}]: ${body}`);
            // 404 UNREGISTERED ya 400 INVALID_ARGUMENT = token stale hai, hata do.
            if (res.status === 404 || body.includes("UNREGISTERED") || body.includes("INVALID_ARGUMENT")) {
              staleTokens.push(token);
            }
          } catch (error) {
            console.error("FCM send error:", error);
          }
        }

        if (staleTokens.length > 0) {
          await supabaseAdmin.from("push_tokens").delete().in("token", staleTokens);
        }

        return Response.json({ sent });
      },
    },
  },
});
