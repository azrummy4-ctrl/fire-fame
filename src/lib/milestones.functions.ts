import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const syncMilestones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Daily reset at 12 AM India time (UTC+5:30).
    const ist = new Date(Date.now() + 330 * 60000);
    const today = ist.toISOString().slice(0, 10);
    const dayStart = new Date(Date.parse(`${today}T00:00:00Z`) - 330 * 60000);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const { data: matches, error } = await context.supabase
      .from("participants")
      .select("tournament_id, tournaments!inner(results_published, starts_at)")
      .eq("user_id", context.userId)
      .eq("tournaments.results_published", true)
      .gte("tournaments.starts_at", dayStart.toISOString())
      .lt("tournaments.starts_at", dayEnd.toISOString());
    if (error) throw error;
    const { data: claims, error: claimError } = await context.supabase
      .from("milestone_spins").select("milestone, amount").eq("user_id", context.userId).eq("claim_date", today);
    if (claimError) throw claimError;
    return { played: new Set((matches ?? []).map(m => m.tournament_id)).size, claims: claims ?? [] };
  });

export const spinMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ milestone: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: reward, error } = await context.supabase.rpc("claim_milestone_spin", { _milestone: data.milestone });
    if (error) throw new Error(error.message);
    return z.object({ amount: z.number(), milestone: z.number(), alreadyClaimed: z.boolean() }).parse(reward);
  });
