import { describe, expect, it } from "vitest";
import { effectiveStatus, isOldCompleted } from "./api";

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

describe("isOldCompleted", () => {
  it("hides completed tournaments 24h after start", () => {
    expect(isOldCompleted({ status: "completed", starts_at: "2026-10-05T09:59:00Z" }, now)).toBe(true);
  });
  it("keeps recent completed tournaments visible", () => {
    expect(isOldCompleted({ status: "completed", starts_at: "2026-10-05T11:00:00Z" }, now)).toBe(false);
  });
  it("never hides live or upcoming tournaments", () => {
    expect(isOldCompleted({ status: "live", starts_at: "2026-10-01T10:00:00Z" }, now)).toBe(false);
    expect(isOldCompleted({ status: "upcoming", starts_at: "2026-10-01T10:00:00Z" }, now)).toBe(false);
  });
});
