import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const saveAndroidDeviceId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ deviceId: z.string().trim().min(8).max(128) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ device_id: data.deviceId })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });