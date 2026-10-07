import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const savePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ token: z.string().min(10), platform: z.string().default("web") }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_tokens").upsert(
      { user_id: context.userId, token: data.token, platform: data.platform },
      { onConflict: "token" },
    );
    if (error) throw error;
    return { ok: true };
  });
