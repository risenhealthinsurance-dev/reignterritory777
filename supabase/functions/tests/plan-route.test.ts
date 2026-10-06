import { describe, expect, it } from "vitest";
import { buildOsrmRequest, parseOsrmRoute } from "../plan-route/index";

describe("OSRM route boundary", () => {
  it("requests a road-network route in stop order", () => {
    expect(buildOsrmRequest([
      { lng: -80.33, lat: 27.44 },
      { lng: -80.34, lat: 27.45 },
    ])).toContain("-80.33,27.44;-80.34,27.45");
  });

  it("flags malformed or missing geometry for review", () => {
    expect(() => parseOsrmRoute({ code: "Ok", routes: [] })).toThrow(/route/i);
  });
});
