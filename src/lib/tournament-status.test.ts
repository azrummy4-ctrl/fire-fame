import { describe, expect, it } from "vitest";
import { effectiveStatus } from "./api";

const now = Date.parse("2026-10-06T10:00:00Z");

describe("effectiveStatus", () => {
  it("stays upcoming before start time", () => {
    expect(effectiveStatus({ status: "upcoming", starts_at: "2026-10-06T10:05:00Z", results_published: false }, now)).toBe("upcoming");
  });
  it("becomes ongoing once start time passes", () => {
    expect(effectiveStatus({ status: "upcoming", starts_at: "2026-10-06T09:59:00Z", results_published: false }, now)).toBe("live");
  });
  it("becomes resulted after results are published", () => {
    expect(effectiveStatus({ status: "live", starts_at: "2026-10-06T09:00:00Z", results_published: true }, now)).toBe("completed");
  });
});
