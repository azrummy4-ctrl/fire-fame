import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatINR } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/deposits")({
  head: () => ({
    meta: [
      { title: "Deposits | FireZone Admin" },
      { name: "description", content: "Verify and settle player deposit orders." },
      { property: "og:title", content: "Deposits | FireZone Admin" },
      { property: "og:description", content: "Deposit verification for admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDeposits,
});

function AdminDeposits() {
  const qc = useQueryClient();

  const { data: deposits, isLoading } = useQuery({
    queryKey: ["admin", "deposits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function settleDeposit(id: string, decision: "completed" | "failed") {
    const { error } = await supabase.rpc("admin_settle_deposit", { _id: id, _decision: decision });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deposit ${decision}`);
    qc.invalidateQueries();
  }

  const pendingCount = (deposits ?? []).filter((d) => d.status === "pending").length;

  return (
    <AdminShell>
      <h2 className="font-display text-lg font-bold">Deposits</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {isLoading ? "Loading…" : pendingCount > 0 ? `${pendingCount} deposit pending hai.` : "Koi deposit pending nahi hai."}
      </p>
      <ul className="mt-3 space-y-2">
        {(deposits ?? []).map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">{formatINR(Number(d.amount))}</p>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{d.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Ref {d.provider_ref} · {formatDateTime(d.created_at)}
            </p>
            {d.status === "pending" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => settleDeposit(d.id, "completed")} className="rounded-lg bg-success py-2 text-xs font-bold text-background">
                  Approve
                </button>
                <button onClick={() => settleDeposit(d.id, "failed")} className="rounded-lg bg-surface-2 py-2 text-xs font-bold text-live">
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
        {(deposits ?? []).length === 0 && (
          <li className="rounded-xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
            Kuch pending nahi.
          </li>
        )}
      </ul>
    </AdminShell>
  );
}
