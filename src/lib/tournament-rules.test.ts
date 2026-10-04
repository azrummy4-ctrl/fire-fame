import { expect, test } from "vitest";
import { CS_1V1_2V2_RULES, rulesFor } from "./tournament-rules";

test("LW 1V1/2V2 category auto-fills the CS 1v1/2v2 rule set", () => {
  expect(rulesFor("LW 1V1/2V2")).toBe(CS_1V1_2V2_RULES);
});

test("CS 1V1/2V2 category auto-fills the CS 1v1/2v2 rule set", () => {
  expect(rulesFor("CS 1V1/2V2")).toBe(CS_1V1_2V2_RULES);
});

test("CS 1v1/2v2 rules ban Orion, A124, Ryden, throwables, zone packing and height", () => {
  const joined = CS_1V1_2V2_RULES.join("\n");
  expect(joined).toContain("Orion, A124 and Ryden");
  expect(joined).toContain("grenades, smoke grenades, flash freezes, flashbangs, dragon freezes, and mini turrets");
  expect(joined).toContain("gloo walls to trap opponents outside the safe zone");
  expect(joined).toContain("Using height for heal purpose or spotting purpose is not allowed");
  expect(joined).toContain("5-10 minutes before the scheduled match time");
});

test("BR FULL MAP keeps its own rule set", () => {
  const rules = rulesFor("BR FULL MAP");
  expect(rules.join("\n")).toContain("horse is completely banned");
  expect(rules).not.toBe(CS_1V1_2V2_RULES);
});

test("other categories keep the default rule set", () => {
  expect(rulesFor("CS ONETAP").join("\n")).toContain("Emulator not allowed");
  expect(rulesFor("CS ONETAP")).not.toBe(CS_1V1_2V2_RULES);
});
