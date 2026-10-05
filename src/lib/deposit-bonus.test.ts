import { describe, expect, it } from "vitest";
import { depositBonus } from "./deposit-bonus";

describe("deposit bonus amounts", () => {
  it("adds ₹5 for a ₹50 deposit", () => expect(depositBonus(50)).toBe(5));
  it("adds ₹11 for a ₹100 deposit", () => expect(depositBonus(100)).toBe(11));
  it("adds ₹22 for a ₹200 deposit", () => expect(depositBonus(200)).toBe(22));
  it("adds ₹33 for a ₹300 deposit", () => expect(depositBonus(300)).toBe(33));
  it("does not award an unadvertised amount", () => expect(depositBonus(500)).toBe(0));
});