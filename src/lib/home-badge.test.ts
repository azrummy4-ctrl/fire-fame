import { describe, expect, it } from "vitest";
import { homeUpcomingCounts } from "./api";

describe("homeUpcomingCounts", () => {
  it("counts only upcoming tournaments per game", () => {
    expect(
      homeUpcomingCounts([
        { category: "BR FULL MAP", status: "upcoming" },
        { category: "BR FULL MAP", status: "upcoming" },
        { category: "BR FULL MAP", status: "live" },
        { category: "BR FULL MAP", status: "completed" },
        { category: "CS ONETAP", status: "upcoming" },
        { category: "LW LOSE", status: "completed" },
      ]),
    ).toEqual({ "BR FULL MAP": 2, "CS ONETAP": 1 });
  });

  it("gives no badge to games with nothing open to join", () => {
    expect(homeUpcomingCounts([{ category: "ONLY UMP", status: "live" }, { category: "FREE MATCH", status: "completed" }])).toEqual({});
  });
});
