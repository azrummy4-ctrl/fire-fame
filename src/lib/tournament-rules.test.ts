import { expect, test } from "vitest";
import { BR_FULL_MAP_RULES, CLASH_SQUAD_RULES, LW_HEADSHOT_RULES, LW_LOSE_RULES, LW_RULES, rulesFor } from "./tournament-rules";

test("LW 1V1/2V2 category auto-fills the Lone Wolf rule set", () => {
  expect(rulesFor("LW 1V1/2V2")).toBe(LW_RULES);
  expect(rulesFor("LW 1V1 / 2V2")).toBe(LW_RULES);
});

test("Lone Wolf rules ban A124 and require 30-minute results", () => {
  const joined = LW_RULES.join("\n");
  expect(joined).toContain("A124 is strictly prohibited and banned from LW 1V1 and LW 2V2");
  expect(joined).toContain("under 30 minutes after the scheduled match time");
  expect(joined).toContain("5-10 minutes before the scheduled match time");
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

test("LW 1V1/2V2 does NOT get the clash squad or BR rule set", () => {
  expect(rulesFor("LW 1V1/2V2")).not.toBe(CLASH_SQUAD_RULES);
  expect(rulesFor("LW 1V1/2V2")).not.toBe(BR_FULL_MAP_RULES);
});

test("BR FULL MAP keeps its own rule set", () => {
  const rules = rulesFor("BR FULL MAP");
  expect(rules.join("\n")).toContain("horse is completely banned");
  expect(rules).not.toBe(CLASH_SQUAD_RULES);
});

test("BR SURVIVAL, BR SURVIVAL 2, BR RUSH FULL MAP and SOLO get the BR Full Map rule set", () => {
  expect(rulesFor("BR SURVIVAL")).toBe(BR_FULL_MAP_RULES);
  expect(rulesFor("BR SURVIVAL 2")).toBe(BR_FULL_MAP_RULES);
  expect(rulesFor("BR RUSH FULL MAP")).toBe(BR_FULL_MAP_RULES);
  expect(rulesFor("SOLO")).toBe(BR_FULL_MAP_RULES);
});

test("LW LOSE auto-fills its own FIREZONE rule set", () => {
  expect(rulesFor("LW LOSE")).toBe(LW_LOSE_RULES);
  const joined = LW_LOSE_RULES.join("\n");
  expect(joined).toContain("Orion, A124 and Ryden");
  expect(joined).toContain("FIREZONE reserves the right");
  expect(joined).toContain("5-10 minutes before the scheduled match time");
  expect(joined).toContain("within 1 to 1.5 hours");
  expect(joined).not.toContain("horse is completely banned");
  expect(joined).not.toContain("Double Vector");
});

test("LW HEADSHOT and LONE WOLF auto-fill their own FIREZONE rule set", () => {
  expect(rulesFor("LW HEADSHOT")).toBe(LW_HEADSHOT_RULES);
  expect(rulesFor("LONE WOLF")).toBe(LW_HEADSHOT_RULES);
  const joined = LW_HEADSHOT_RULES.join("\n");
  expect(joined).toContain("FIREZONE reserves the right");
  expect(joined).toContain("FIREZONE-related issues");
  expect(joined).toContain("A124 is strictly prohibited and banned from LW 1V1 and LW 2V2");
  expect(joined).toContain("under 30 minutes after the scheduled match time");
  expect(joined).toContain("5-10 minutes before the scheduled match time");
  expect(joined).not.toContain("horse is completely banned");
  expect(joined).not.toContain("Double Vector");
});

test("remaining categories keep the default rule set", () => {
  expect(rulesFor("CS ONETAP").join("\n")).toContain("Orion, A124 and Ryden");
  expect(rulesFor("BR SURVIVAL").join("\n")).toContain("horse is completely banned");
});
