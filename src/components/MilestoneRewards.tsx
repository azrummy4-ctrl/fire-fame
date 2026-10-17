import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Flag, LockKeyhole, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MILESTONES, milestoneProgress, type Milestone } from "@/lib/milestones";
import { syncMilestones, spinMilestone } from "@/lib/milestones.functions";
import { useSession, formatINR } from "@/lib/api";

export function MilestoneRewards() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["milestones", user?.id], enabled: Boolean(user),
    queryFn: () => syncMilestones(), staleTime: 0,
  });
  const [selected, setSelected] = useState<Milestone | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  async function spin() {
    if (!selected || spinning || reward !== null) return;
    setSpinning(true);
    try {
      const [result] = await Promise.all([
        spinMilestone({ data: { milestone: selected.matches } }),
        new Promise(resolve => setTimeout(resolve, 1800)),
      ]);
      setReward(result.amount);
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Spin failed. Please try again.");
    } finally { setSpinning(false); }
  }
  return (
    <section className="mt-5">
      <div className="flex items-center gap-2"><Flag className="size-5 text-gold" /><h2 className="font-display text-xl font-bold">Milestone Spins</h2></div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{data?.played ?? 0} completed matches</span><span>Rewards up to ₹8</span></div>
      {isError ? <Button variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button> : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MILESTONES.map(m => {
            const claim = data?.claims.find(c => c.milestone === m.matches);
            const played = data?.played ?? 0;
            const ready = played >= m.matches;
            return <div key={m.matches} className={`rounded-lg border p-3 ${claim ? "border-success/40 bg-success/10" : "border-border bg-surface"}`}>
              <p className="font-display text-lg font-bold">{m.matches} Matches</p>
              <p className="mt-1 text-xs text-gold">{m.minAmount === m.amount ? formatINR(m.amount) : "₹1–₹2"} reward</p>
              <Progress className="mt-3" value={milestoneProgress(played, m.matches)} aria-label={`${m.matches} match progress`} />
              <p className="mt-2 text-xs text-muted-foreground">{claim ? `Won ${formatINR(Number(claim.amount))}` : ready ? "1 spin available" : `${Math.max(0, m.matches - played)} matches baaki`}</p>
              <Button className="mt-3 w-full" variant={claim ? "secondary" : "default"} disabled={Boolean(claim) || !ready || isPending} onClick={() => { setSelected(m); setReward(null); }}>
                {ready ? <RotateCw /> : <LockKeyhole />}{claim ? "Claimed" : "Spin"}
              </Button>
            </div>;
          })}
        </div>
      )}
      <Dialog open={selected !== null} onOpenChange={open => { if (!open && !spinning) setSelected(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-sm" onEscapeKeyDown={e => { if (spinning) e.preventDefault(); }} onPointerDownOutside={e => { if (spinning) e.preventDefault(); }}>
          <DialogTitle className="text-center font-display text-2xl">{reward === null ? "Milestone Spin" : "Congratulations!"}</DialogTitle>
          <DialogDescription className="text-center">{selected?.matches} Matches · {selected?.minAmount === selected?.amount ? formatINR(selected?.amount ?? 0) : "₹1–₹2"} reward</DialogDescription>
          <div className="relative mx-auto grid size-52 place-items-center">
            <div className={`milestone-wheel absolute inset-0 rounded-full border-4 border-gold ${spinning ? "milestone-wheel-spinning" : ""}`} />
            <div className="relative grid size-24 place-items-center rounded-full border-4 border-gold bg-background text-gold"><Coins className="size-10" /></div>
          </div>
          <p className="min-h-8 text-center font-display text-xl font-bold text-gold" aria-live="polite">{reward === null ? "Rewards up to ₹8" : `${formatINR(reward)} added to wallet`}</p>
          <Button size="lg" disabled={spinning} onClick={reward === null ? spin : () => setSelected(null)}><RotateCw />{spinning ? "Spinning…" : reward === null ? "SPIN NOW" : "Done"}</Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
