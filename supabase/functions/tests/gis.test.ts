import { describe, expect, it, vi } from "vitest";
import { fetchArcGisLayer, normalizePolygonGeometry } from "../_shared/sources";

describe("fetchArcGisLayer", () => {
  it("normalizes ArcGIS Polygon geometry for PostGIS MultiPolygon columns", () => {
    expect(
      normalizePolygonGeometry({
        type: "Polygon",
        coordinates: [[[-80.33, 27.44]]],
      }),
    ).toEqual({ type: "MultiPolygon", coordinates: [[[[-80.33, 27.44]]]] });
  });

  it("pages through ArcGIS GeoJSON and preserves source metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: "FeatureCollection",
            exceededTransferLimit: true,
            features: [
              {
                type: "Feature",
                id: 10,
                properties: { OBJECTID: 10, ZONING: "C-2" },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-80.33, 27.44],
                      [-80.32, 27.44],
                      [-80.32, 27.45],
                      [-80.33, 27.44],
                    ],
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: "FeatureCollection",
            exceededTransferLimit: false,
            features: [
              {
                type: "Feature",
                id: 11,
                properties: { OBJECTID: 11, ZONING: "MU" },
                geometry: null,
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await fetchArcGisLayer({
      baseUrl: "https://services.test/FeatureServer",
      layer: 3,
      pageSize: 1,
      fetcher,
      retrievedAt: "2026-10-04T14:00:00.000Z",
    });

    expect(fetcher.mock.calls[0][0]).toContain("resultOffset=0");
    expect(fetcher.mock.calls[1][0]).toContain("resultOffset=1");
    expect(result.records).toEqual([
      expect.objectContaining({
        sourceId: "10",
        retrievedAt: "2026-10-04T14:00:00.000Z",
        geometry: expect.objectContaining({ type: "Polygon" }),
      }),
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({ sourceId: "11", code: "missing_geometry" }),
    ]);
  });

  it("rejects a malformed ArcGIS response rather than treating it as an empty layer", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response("not-json", { status: 200, headers: { "content-type": "text/plain" } }),
      );

    await expect(
      fetchArcGisLayer({
        baseUrl: "https://services.test/FeatureServer",
        layer: 1,
        pageSize: 100,
        fetcher,
        retrievedAt: "2026-10-04T14:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "malformed_source" });
  });
});
