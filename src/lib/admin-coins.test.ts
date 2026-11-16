import { describe, expect, it } from "vitest";
import { coinAdjustmentResult } from "./admin-coins";

describe("admin coin adjustment balance rules", () => {
  it("allows adding and subtracting coins when the result stays non-negative", () => {
    expect(coinAdjustmentResult(215, 10)).toBe(225);
    expect(coinAdjustmentResult(215, -15)).toBe(200);
  });

  it("rejects zero or adjustments that would make the balance negative", () => {
    expect(coinAdjustmentResult(215, 0)).toBeNull();
    expect(coinAdjustmentResult(215, -216)).toBeNull();
  });
});