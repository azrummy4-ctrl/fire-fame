import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const syncMilestones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: matches, error } = await context.supabase
      .from("participants")
      .select("tournament_id, tournaments!inner(results_published)")
      .eq("user_id", context.userId)
      .eq("tournaments.results_published", true);
    if (error) throw error;
    const { data: claims, error: claimError } = await context.supabase
      .from("milestone_spins").select("milestone, amount").eq("user_id", context.userId);
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
