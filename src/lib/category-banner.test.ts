import { describe, expect, it } from "vitest";
import { bannerFor, categoryBannerKey, homeGameCatalog } from "./api";

describe("automatic tournament category artwork", () => {
  it("assigns a distinct configured banner to every Home category", () => {
    const keys = homeGameCatalog.map((game) => categoryBannerKey(game.category));

    expect(keys).toHaveLength(12);
    expect(keys.every(Boolean)).toBe(true);
    expect(new Set(keys).size).toBe(12);
  });

  it("uses the selected category artwork when a tournament has no uploaded banner", () => {
    expect(bannerFor(null, "CS ONETAP")).toBe(bannerFor("mode-cs-onetap"));
    expect(bannerFor(null, "LW HEADSHOT")).toBe(bannerFor("mode-lw-headshot"));
  });
});