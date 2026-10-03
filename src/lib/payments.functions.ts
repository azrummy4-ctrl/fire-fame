import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ZAPUPI_BASE = "https://pay.zapupi.com/api";

type ZapUpiCreateResponse = {
  status?: string; // "success"
  message?: string;
  order_id?: string;
  payment_url?: string;
};

type ZapUpiStatusResponse = {
  status?: string; // "success"
  message?: string;
  data?: {
    order_id?: string;
    status?: string;
    txn_status?: string;
    payment_status?: string;
    amount?: string | number;
    utr?: string;
  };
};

function zapupiKey() {
  const key = process.env["ZAPUPI_TOKEN_KEY"];
  if (!key) {
    throw new Error("Payment gateway abhi configured nahi hai. Admin se contact karein.");
  }
  return key;
}

async function zapupiPost(path: string, fields: Record<string, string>) {
  const res = await fetch(`${ZAPUPI_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Payment gateway se response nahi mila. Thodi der baad try karein.");
  return res.json();
}

export const createDepositOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        amount: z.number().int().min(10, "Minimum deposit ₹10 hai").max(50000, "Maximum deposit ₹50,000 hai"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const zapKey = zapupiKey();

    // Ek time par sirf ek pending gateway deposit
    const { data: existing } = await supabase
      .from("deposits")
      .select("id, provider_ref")
      .eq("user_id", userId)
      .eq("provider", "zapupi")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) throw new Error("Aapka ek deposit pehle se pending hai. Use complete ya expire hone dein.");

    const orderId = `FZ${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const origin = new URL(getRequest().url).origin;
    const redirectUrl = `${origin}/wallet?deposit_order=${orderId}`;

    const createRes = (await zapupiPost("/create-order", {
      zap_key: zapKey,
      amount: String(data.amount),
      order_id: orderId,
      remark: "FireZone wallet deposit",
      success_url: redirectUrl,
      failed_url: redirectUrl,
      timeout_url: redirectUrl,
    })) as ZapUpiCreateResponse;

    const paymentUrl = createRes?.payment_url;
    if (createRes?.status !== "success" || !paymentUrl) {
      throw new Error(createRes?.message || "Payment order create nahi ho paya. Dobara try karein.");
    }

    // Users have no direct INSERT on deposits — insert via admin client
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: depErr } = await supabaseAdmin.from("deposits").insert({
      user_id: userId,
      amount: data.amount,
      provider: "zapupi",
      provider_ref: orderId,
      status: "pending",
    });
    if (depErr) throw new Error("Deposit record save nahi hua. Dobara try karein.");

    return { orderId, paymentUrl };
  });

export const verifyDepositPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().min(6).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const zapKey = zapupiKey();

    const { data: deposit } = await supabase
      .from("deposits")
      .select("*")
      .eq("provider_ref", data.orderId)
      .eq("provider", "zapupi")
      .maybeSingle();
    if (!deposit || deposit.user_id !== userId) throw new Error("Deposit nahi mila.");
    if (deposit.status === "completed") return { status: "completed" as const };
    if (deposit.status !== "pending") return { status: deposit.status as "failed" };

    const statusRes = (await zapupiPost("/order-status", {
      zap_key: zapKey,
      order_id: data.orderId,
    })) as ZapUpiStatusResponse;

    const txnData = statusRes?.data ?? {};
    const txnStatus = String(
      txnData.txn_status ?? txnData.payment_status ?? txnData.status ?? "",
    ).toUpperCase();

    if (txnStatus === "SUCCESS") {
      // Amount tamper guard: gateway amount must match our record
      const paidAmount = Number(txnData.amount ?? deposit.amount);
      if (Math.abs(paidAmount - Number(deposit.amount)) > 0.01) {
        throw new Error("Payment amount mismatch. Support se contact karein.");
      }

      // Privileged write: user has no UPDATE on deposits; credit wallet atomically
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Idempotency: only one completion wins
      const { data: updated, error: upErr } = await supabaseAdmin
        .from("deposits")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", deposit.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (upErr) throw new Error("Deposit update failed.");
      if (!updated) return { status: "completed" as const }; // already settled concurrently

      const { error: walletErr } = await supabaseAdmin.rpc("wallet_apply", {
        _user_id: userId,
        _type: "deposit",
        _amount: Number(deposit.amount),
        _ref: deposit.id,
        _note: `ZapUpi deposit ${data.orderId}`,
      });
      if (walletErr) throw new Error("Wallet credit failed. Support se contact karein.");

      return { status: "completed" as const };
    }

    if (txnStatus === "FAILED" || txnStatus === "CANCELLED" || txnStatus === "EXPIRED") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("deposits")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", deposit.id)
        .eq("status", "pending");
      return { status: "failed" as const };
    }

    return { status: "pending" as const };
  });
