import { describe, expect, it } from "vitest";
import { MILESTONES, achievedMilestones, milestoneProgress } from "./milestones";

describe("milestones", () => {
  it("targets ascending hain aur rewards positive hain", () => {
    for (let i = 1; i < MILESTONES.length; i++) {
      expect(MILESTONES[i]!.matches).toBeGreaterThan(MILESTONES[i - 1]!.matches);
    }
    for (const m of MILESTONES) {
      expect(m.amount).toBeGreaterThan(0);
    }
  });

  it("progress 0-100 ke beech clamp hota hai", () => {
    const { matches } = MILESTONES[0];
    expect(milestoneProgress(0, matches)).toBe(0);
    expect(milestoneProgress(matches, matches)).toBe(100);
    expect(milestoneProgress(matches * 5, matches)).toBe(100);
  });

  it("sirf pure hue milestones achieved list me aate hain", () => {
    const played = MILESTONES[1].matches;
    expect(achievedMilestones(played)).toHaveLength(2);
    expect(achievedMilestones(played - 1)).toHaveLength(1);
    expect(achievedMilestones(0)).toHaveLength(0);
  });
});
