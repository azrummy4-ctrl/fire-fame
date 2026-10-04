import { expect, test } from "vitest";
import { tournamentModes } from "./tournament-mode";

test("tournament hosting offers Solo, Duo and Squad modes", () => {
  expect(tournamentModes).toEqual(["Solo", "Duo", "Squad"]);
});