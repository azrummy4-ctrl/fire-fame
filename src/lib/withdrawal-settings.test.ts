import { describe, expect, it } from "vitest";
import { validateMinimumWithdrawal } from "./withdrawal-settings";

describe("minimum withdrawal setting", () => {
  it("accepts a whole amount from 1 through the configured maximum", () => {
    expect(validateMinimumWithdrawal("1", 10000)).toBe(1);
    expect(validateMinimumWithdrawal("10000", 10000)).toBe(10000);
  });

  it("rejects zero, fractions, and amounts above the maximum", () => {
    expect(validateMinimumWithdrawal("0", 10000)).toBeNull();
    expect(validateMinimumWithdrawal("2.5", 10000)).toBeNull();
    expect(validateMinimumWithdrawal("10001", 10000)).toBeNull();
  });
});