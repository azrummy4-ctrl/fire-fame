import { createFileRoute } from "@tanstack/react-router";

const ZAPUPI_BASE = "https://pay.zapupi.com/api";

type ZapUpiStatusResponse = {
  status?: string;
  data?: {
    order_id?: string;
    status?: string;
    txn_status?: string;
    payment_status?: string;
    amount?: string | number;
  };
};

function extractOrderId(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload["order_id"],
    payload["orderId"],
    payload["order"],
    (payload["data"] as Record<string, unknown> | undefined)?.["order_id"],
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length >= 6 && c.length <= 64) return c;
  }
  return null;
}

export const Route = createFileRoute("/api/public/webhooks/zapupi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown>;
        try {
          const text = await request.text();
          payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          return new Response("bad request", { status: 400 });
        }

        const orderId = extractOrderId(payload);
        if (!orderId) return new Response("no order_id", { status: 400 });

        const zapKey = process.env["ZAPUPI_TOKEN_KEY"];
        if (!zapKey) return new Response("not configured", { status: 500 });

        // Never trust the webhook payload alone — verify with ZapUpi directly
        const statusRes = (await fetch(`${ZAPUPI_BASE}/order-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zap_key: zapKey, order_id: orderId }),
        }).then((r) => r.json())) as ZapUpiStatusResponse;

        const txnData = statusRes?.data ?? {};
        const txnStatus = String(
          txnData.txn_status ?? txnData.payment_status ?? txnData.status ?? "",
        ).toUpperCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: deposit } = await supabaseAdmin
          .from("deposits")
          .select("*")
          .eq("provider_ref", orderId)
          .eq("provider", "zapupi")
          .maybeSingle();

        if (!deposit || deposit.status !== "pending") {
          // Unknown order or already settled — acknowledge so ZapUpi stops retrying
          return new Response("ok", { status: 200 });
        }

        if (txnStatus === "SUCCESS") {
          const paidAmount = Number(txnData.amount ?? deposit.amount);
          if (Math.abs(paidAmount - Number(deposit.amount)) > 0.01) {
            return new Response("amount mismatch", { status: 400 });
          }

          // Idempotent: only one pending -> completed transition wins
          const { data: updated } = await supabaseAdmin
            .from("deposits")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", deposit.id)
            .eq("status", "pending")
            .select("id")
            .maybeSingle();

          if (updated) {
            await supabaseAdmin.rpc("wallet_apply", {
              _user_id: deposit.user_id,
              _type: "deposit",
              _amount: Number(deposit.amount),
              _ref: deposit.id,
              _note: `ZapUpi deposit ${orderId}`,
            });
          }
          return new Response("ok", { status: 200 });
        }

        if (txnStatus === "FAILED" || txnStatus === "CANCELLED" || txnStatus === "EXPIRED") {
          await supabaseAdmin
            .from("deposits")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("id", deposit.id)
            .eq("status", "pending");
          return new Response("ok", { status: 200 });
        }

        // Still pending — acknowledge, user-side polling will settle later
        return new Response("ok", { status: 200 });
      },
    },
  },
});
