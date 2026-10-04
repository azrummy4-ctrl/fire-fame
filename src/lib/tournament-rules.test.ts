import { expect, test } from "vitest";
import { CLASH_SQUAD_RULES, rulesFor } from "./tournament-rules";

test("CLASH SQUAD category auto-fills the clash squad rule set", () => {
  expect(rulesFor("CLASH SQUAD")).toBe(CLASH_SQUAD_RULES);
});

test("clash squad rules ban Orion, A124, Ryden, throwables, zone packing and height", () => {
  const joined = CLASH_SQUAD_RULES.join("\n");
  expect(joined).toContain("Orion, A124 and Ryden");
  expect(joined).toContain("grenades, smoke grenades, flash freezes, flashbangs, dragon freezes, and mini turrets");
  expect(joined).toContain("gloo walls to trap opponents outside the safe zone");
  expect(joined).toContain("Using height for heal purpose or spotting purpose is not allowed");
  expect(joined).toContain("5-10 minutes before the scheduled match time");
});

test("CS ONETAP, ONLY UMP and CS 4V4 also get the clash squad rule set", () => {
  expect(rulesFor("CS ONETAP")).toBe(CLASH_SQUAD_RULES);
  expect(rulesFor("ONLY UMP")).toBe(CLASH_SQUAD_RULES);
  expect(rulesFor("CS 4V4")).toBe(CLASH_SQUAD_RULES);
});

test("LW 1V1/2V2 does NOT get the clash squad rule set", () => {
  expect(rulesFor("LW 1V1/2V2")).not.toBe(CLASH_SQUAD_RULES);
});

test("BR FULL MAP keeps its own rule set", () => {
  const rules = rulesFor("BR FULL MAP");
  expect(rules.join("\n")).toContain("horse is completely banned");
  expect(rules).not.toBe(CLASH_SQUAD_RULES);
});

test("remaining categories keep the default rule set", () => {
  expect(rulesFor("LONE WOLF")).not.toBe(CLASH_SQUAD_RULES);
  expect(rulesFor("LW LOSE").join("\n")).toContain("Emulator not allowed");
  expect(rulesFor("BR SURVIVAL").join("\n")).toContain("Emulator not allowed");
});
