import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Ban, CircleCheck, Coins, Mail, Smartphone, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { adjustAdminUserCoins, getAdminUserDetail, setAdminUserStatus } from "@/lib/admin-users.functions";
import { formatDateTime, formatINR } from "@/lib/api";
import { coinAdjustmentResult } from "@/lib/admin-coins";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  head: () => ({
    meta: [
      { title: "Player Account | FireZone Admin" },
      { name: "description", content: "Review a player account and make audited account changes." },
      { property: "og:title", content: "Player Account | FireZone Admin" },
      { property: "og:description", content: "Player account details and wallet management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const getDetail = useServerFn(getAdminUserDetail);
  const setStatus = useServerFn(setAdminUserStatus);
  const adjustCoins = useServerFn(adjustAdminUserCoins);
  const [coinAmount, setCoinAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["admin", "user-detail", userId],
    queryFn: () => getDetail({ data: { userId } }),
  });

  async function toggleBlock() {
    if (!user) return;
    setBusy(true);
    try {
      const result = await setStatus({ data: { userId, status: user.status === "active" ? "banned" : "active" } });
      toast.success(result.status === "active" ? "Account unblocked" : "Account blocked");
      await qc.invalidateQueries({ queryKey: ["admin", "user-detail", userId] });
      await qc.invalidateQueries({ queryKey: ["admin", "user-list"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account update nahi hua");
    } finally {
      setBusy(false);
    }
  }

  async function submitCoins(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const amount = Number(coinAmount);
    if (coinAdjustmentResult(Number(user.balance), amount) === null) {
      toast.error("Sahi coin amount daalein; balance zero se neeche nahi ja sakta.");
      return;
    }
    setBusy(true);
    try {
      await adjustCoins({ data: { userId, amount, note } });
      toast.success("Coins update ho gaye");
      setCoinAmount("");
      setNote("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "user-detail", userId] }),
        qc.invalidateQueries({ queryKey: ["admin", "user-list"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coins update nahi hue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <Link to="/admin/users" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="size-4" /> Back to users
      </Link>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading player…</p>
      ) : isError || !user ? (
        <p className="rounded-md border border-border bg-surface p-4 text-sm">Player account nahi mila.</p>
      ) : (
        <>
          <div className="border-b border-border pb-5 pt-2">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-primary"><UserRound className="size-6" /></span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-2xl font-bold">{user.ign || "Player"}</h1>
                <span className={`text-xs font-bold uppercase ${user.status === "active" ? "text-success" : "text-live"}`}>{user.status === "active" ? "Active account" : "Blocked account"}</span>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-border">
              <DetailRow icon={Mail} label="Gmail" value={user.email || "Unavailable"} />
              <DetailRow icon={Smartphone} label="Device ID" value={user.device_id || "Not available"} />
              <DetailRow icon={UserRound} label="Referral code" value={user.referral_code || "—"} />
              <DetailRow icon={UserRound} label="Join date" value={user.created_at ? formatDateTime(user.created_at) : "—"} />
              <DetailRow icon={Coins} label="Current coins" value={formatINR(Number(user.balance))} />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">IP address collect nahi hota.</p>
          </div>

          <section className="border-b border-border py-5">
            <h2 className="font-display text-lg font-bold">Wallet coins</h2>
            <form onSubmit={submitCoins} className="mt-3 space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground" htmlFor="coin-change">Add or remove coins</label>
              <input id="coin-change" type="number" step="0.01" required value={coinAmount} onChange={(event) => setCoinAmount(event.target.value)} placeholder="Example: 10 or -5" className="h-11 w-full rounded-md border border-input bg-surface px-3 text-sm outline-none focus:border-primary" />
              <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={250} placeholder="Reason (optional)" className="h-11 w-full rounded-md border border-input bg-surface px-3 text-sm outline-none focus:border-primary" />
              <Button type="submit" disabled={busy} className="w-full"><Coins /> Update coins</Button>
            </form>
          </section>

          <section className="py-5">
            <h2 className="font-display text-lg font-bold">Account access</h2>
            <p className="mt-1 text-xs text-muted-foreground">Blocked players cannot join contests or request withdrawals.</p>
            <Button type="button" variant={user.status === "active" ? "destructive" : "default"} disabled={busy} onClick={toggleBlock} className="mt-3 w-full">
              {user.status === "active" ? <Ban /> : <CircleCheck />}
              {user.status === "active" ? "Block user" : "Unblock user"}
            </Button>
          </section>
        </>
      )}
    </AdminShell>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <dt className="w-28 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-right text-sm font-semibold">{value}</dd>
    </div>
  );
}