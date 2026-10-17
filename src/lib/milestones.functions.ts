import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MILESTONES } from "./milestones";

// Milestone rewards sirf server pe credit hote hain — client se amount claim nahi ho sakta.
// Earn page khulte hi ye chalega: played count dekho, naye milestone pura hua to wallet me
// auto credit + notification. Idempotent: milestone_claims me unique (user_id, milestone).
export const syncMilestones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;

    // Matches played = result publish ho chuke tournaments jinme user join tha
    const { count, error: cErr } = await context.supabase
      .from("participants")
      .select("id, tournaments!inner(results_published)", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("tournaments.results_published", true);
    if (cErr) throw cErr;
    const played = count ?? 0;

    const { data: claims, error: clErr } = await context.supabase
      .from("milestone_claims")
      .select("milestone")
      .eq("user_id", uid);
    if (clErr) throw clErr;
    const claimed = new Set((claims ?? []).map((c) => Number(c.milestone)));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const m of MILESTONES) {
      if (claimed.has(m.matches) || played < m.matches) continue;

      // Insert first — unique constraint concurrent double-credit ko rokta hai
      const { data: claim, error: insErr } = await supabaseAdmin
        .from("milestone_claims")
        .insert({ user_id: uid, milestone: m.matches, amount: m.amount })
        .select("id")
        .maybeSingle();
      if (insErr) continue; // already claimed concurrently
      if (!claim) continue;

      const { error: walletErr } = await supabaseAdmin.rpc("wallet_apply", {
        _user_id: uid,
        _type: "milestone_reward",
        _amount: m.amount,
        _ref: claim.id as string,
        _note: `Milestone: ${m.matches} matches played`,
      });
      if (walletErr) {
        console.error("Milestone wallet credit failed", m.matches, walletErr);
        continue;
      }

      await supabaseAdmin.from("notifications").insert({
        user_id: uid,
        title: "Milestone achieved! 🏆",
        body: `Aapne ${m.matches} matches khel liye — ₹${m.amount} bonus wallet me add ho gaya!`,
        kind: "reward",
      });

      claimed.add(m.matches);
    }

    return { played, claimedMilestones: [...claimed].sort((a, b) => a - b) };
  });
