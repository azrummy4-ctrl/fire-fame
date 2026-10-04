import { expect, test } from "bun:test";
import { tournamentModes } from "./tournament-mode";

test("tournament hosting offers Solo, Duo and Squad modes", () => {
  expect(tournamentModes).toEqual(["Solo", "Duo", "Squad"]);
});