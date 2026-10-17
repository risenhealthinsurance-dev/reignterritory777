import { describe, expect, test } from "vitest";
import { dispositionColor } from "./dispositionColor";

describe("dispositionColor", () => {
  test.each([
    ["Not interested", "red"],
    ["Connected", "green"],
    ["Qualified", "green"],
    ["Callback requested", "yellow"],
    ["No answer", "yellow"],
    ["Proposal", "blue"],
    [undefined, "gray"],
  ])("maps %s to %s", (outcome, expected) => {
    expect(dispositionColor(outcome)).toBe(expected);
  });
});
