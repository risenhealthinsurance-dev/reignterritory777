import { describe, expect, it } from "vitest";
import { buildZoningOverlay, normalizeGeoJsonFeature } from "./gis";

describe("GIS overlay adapter", () => {
  it("preserves source identity and maps zoning classification to a selectable feature", () => {
    const feature = normalizeGeoJsonFeature({
      type: "Feature",
      id: "parcel-1",
      properties: { zoning_code: "C-3", zoning_description: "Commercial" },
      geometry: { type: "Polygon", coordinates: [] },
    }, "fort-pierce-zoning");

    expect(feature).toEqual(expect.objectContaining({
      type: "Feature",
      id: "parcel-1",
      properties: expect.objectContaining({ sourceId: "fort-pierce-zoning", selectable: true }),
    }));
    expect(buildZoningOverlay([feature]).features).toHaveLength(1);
  });

  it("drops malformed geometry without poisoning the remaining page", () => {
    expect(normalizeGeoJsonFeature({ type: "Feature", properties: {}, geometry: null }, "source")).toBeNull();
  });
});
