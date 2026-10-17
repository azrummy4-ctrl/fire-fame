import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flag, LockKeyhole, RotateCw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MILESTONES, SPIN_WHEEL_DISPLAY, milestoneProgress, type Milestone } from "@/lib/milestones";
import { syncMilestones, spinMilestone } from "@/lib/milestones.functions";
import { useSession, formatINR } from "@/lib/api";
import { SpinWheel } from "@/components/SpinWheel";

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
  const spinsLeft = MILESTONES.filter(m => (data?.played ?? 0) >= m.matches && !data?.claims.some(c => c.milestone === m.matches)).length;
  const selectedClaim = data?.claims.find(c => c.milestone === selected?.matches);
  const canSpin = selected !== null && (data?.played ?? 0) >= selected.matches && !selectedClaim;
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
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{data?.played ?? 0} completed matches</span><span>Win up to ₹1000</span></div>
      {isError ? <Button variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button> : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MILESTONES.map(m => {
            const claim = data?.claims.find(c => c.milestone === m.matches);
            const played = data?.played ?? 0;
            const ready = played >= m.matches;
            return <div key={m.matches} className={`rounded-lg border p-3 ${claim ? "border-success/40 bg-success/10" : "border-border bg-surface"}`}>
              <p className="font-display text-lg font-bold">{m.matches} Matches</p>
              <p className="mt-1 text-xs text-gold">Upto ₹1000 reward</p>
              <Progress className="mt-3" value={milestoneProgress(played, m.matches)} aria-label={`${m.matches} match progress`} />
              <p className="mt-2 text-xs text-muted-foreground">{claim ? `Won ${formatINR(Number(claim.amount))}` : ready ? "1 spin available" : `${Math.max(0, m.matches - played)} matches baaki`}</p>
              <Button className="mt-3 w-full" variant={claim ? "secondary" : "default"} disabled={isPending} onClick={() => { setSelected(m); setReward(null); }}>
                {ready ? <RotateCw /> : <LockKeyhole />}{claim ? "Claimed" : "Spin"}
              </Button>
            </div>;
          })}
        </div>
      )}
      <Dialog open={selected !== null} onOpenChange={open => { if (!open && !spinning) setSelected(null); }}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-sm gap-5 overflow-y-auto rounded-lg border-spin-surface bg-spin-background px-5 py-6 text-spin-dark [&>button.absolute]:hidden" onEscapeKeyDown={e => { if (spinning) e.preventDefault(); }} onPointerDownOutside={e => { if (spinning) e.preventDefault(); }}>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="rounded-full bg-spin-surface text-spin-primary hover:bg-spin-surface" disabled={spinning} onClick={() => setSelected(null)} aria-label="Back to milestones"><ArrowLeft /></Button>
            <DialogTitle className="font-display text-2xl font-bold italic text-spin-primary">SPIN AND EARN</DialogTitle>
          </div>
          <div className="spin-summary flex items-center gap-3 rounded-full border-2 border-spin-surface bg-spin-surface px-4 py-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-spin-primary text-spin-surface"><Trophy className="size-6" /></div>
            <div className="min-w-0 flex-1"><p className="text-lg font-bold text-spin-primary">Lucky Wheel</p><DialogDescription className="text-[10px] font-bold text-spin-muted">{selected?.matches} MATCHES · UPTO ₹1000</DialogDescription></div>
            <div className="text-center text-spin-primary"><p className="text-[10px] font-bold">SPINS LEFT</p><p className="text-3xl font-extrabold italic">{spinsLeft}</p></div>
          </div>
          <SpinWheel spinning={spinning} amounts={[...SPIN_WHEEL_DISPLAY]} />
          <p className="min-h-7 text-center text-lg font-bold text-spin-primary" aria-live="polite">{reward !== null ? `${formatINR(reward)} added to wallet!` : selectedClaim ? `Already won ${formatINR(Number(selectedClaim.amount))}` : canSpin ? "You have a free spin available." : `${Math.max(0, (selected?.matches ?? 0) - (data?.played ?? 0))} more matches to unlock`}</p>
          <Button size="lg" className="mx-auto h-12 w-full max-w-72 rounded-full bg-spin-primary text-lg font-bold text-spin-surface hover:bg-spin-primary/90" disabled={spinning || (reward === null && !canSpin)} onClick={reward === null ? spin : () => setSelected(null)}><RotateCw />{spinning ? "SPINNING…" : reward === null ? "SPIN TO WIN" : "DONE"}</Button>
          <p className="text-center text-xs font-bold text-spin-muted">{reward !== null ? "CONGRATULATIONS!" : "COMPLETE MATCHES TO GET MORE SPINS"}</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
