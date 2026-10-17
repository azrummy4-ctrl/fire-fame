// Earn page milestones: kitne matches khelne par kitna bonus milega.
// Matches played = aise tournaments jinke results publish ho chuke hain aur jinme user join tha.
export const MILESTONES = [
  { matches: 10, amount: 5 },
  { matches: 25, amount: 10 },
  { matches: 50, amount: 25 },
  { matches: 100, amount: 50 },
] as const;

export type Milestone = (typeof MILESTONES)[number];

export function milestoneProgress(played: number, target: number) {
  return Math.max(0, Math.min(100, (played / target) * 100));
}

export function achievedMilestones(played: number) {
  return MILESTONES.filter((m) => played >= m.matches);
}
