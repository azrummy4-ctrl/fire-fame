import { describe, expect, it } from "vitest";
import { MILESTONES, achievedMilestones, milestoneProgress } from "./milestones";

describe("milestone spin rules", () => {
  it("offers only 5, 10, 15 and 20 matches", () => {
    expect(MILESTONES.map(m => m.matches)).toEqual([5, 10, 15, 20]);
  });
  it("5 matches pays only 1 or 2 rupees", () => {
    expect(MILESTONES.find(m => m.matches === 5)).toEqual({ matches: 5, minAmount: 1, amount: 2 });
  });
  it.each([[10, 3], [15, 5], [20, 8]])("%i matches pays exactly %i rupees", (matches, amount) => {
    expect(MILESTONES.find(m => m.matches === matches)).toEqual({ matches, minAmount: amount, amount });
  });
  it("unlocks a spin only once the target is complete", () => {
    expect(achievedMilestones(4)).toEqual([]);
    expect(achievedMilestones(5).map(m => m.matches)).toEqual([5]);
    expect(achievedMilestones(19).map(m => m.matches)).toEqual([5, 10, 15]);
    expect(achievedMilestones(20).map(m => m.matches)).toEqual([5, 10, 15, 20]);
  });
  it("clamps progress", () => {
    expect(milestoneProgress(-1, 5)).toBe(0);
    expect(milestoneProgress(3, 5)).toBe(60);
    expect(milestoneProgress(30, 20)).toBe(100);
  });
});
