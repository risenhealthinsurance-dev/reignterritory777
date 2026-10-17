import { describe, expect, it } from "vitest";
import { orderQuadrantsSnake } from "./territoryLifecycle";

describe("quadrant canvass order", () => {
  it("moves right, then snakes right-to-left on the next row", () => {
    expect(orderQuadrantsSnake([
      { id: "B2", row: 2, column: 1 }, { id: "A1", row: 1, column: 0 },
      { id: "C1", row: 1, column: 2 }, { id: "A2", row: 2, column: 0 },
    ]).map((quadrant) => quadrant.id)).toEqual(["A1", "C1", "B2", "A2"]);
  });
});
