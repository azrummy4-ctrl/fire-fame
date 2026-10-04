import { describe, expect, it } from "vitest";
import { REDEEM_AMOUNTS, redeemProgress } from "./redeem";

describe("redeem vouchers", () => {
  it("offers exactly 30, 50, 100, 150, 200, 500", () => {
    expect([...REDEEM_AMOUNTS]).toEqual([30, 50, 100, 150, 200, 500]);
  });
  it("caps progress at 100%", () => {
    expect(redeemProgress(215, 100)).toBe(100);
    expect(redeemProgress(15, 30)).toBe(50);
  });
});
