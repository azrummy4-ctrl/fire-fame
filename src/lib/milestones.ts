// Only result-published tournaments count toward a milestone spin.
export const MILESTONES = [
  { matches: 5, minAmount: 1, amount: 2 },
  { matches: 10, minAmount: 3, amount: 3 },
  { matches: 15, minAmount: 5, amount: 5 },
  { matches: 20, minAmount: 8, amount: 8 },
] as const;
export type Milestone = (typeof MILESTONES)[number];
export function milestoneProgress(played: number, target: number) {
  return Math.max(0, Math.min(100, (played / target) * 100));
}
export function achievedMilestones(played: number) {
  return MILESTONES.filter((m) => played >= m.matches);
}
