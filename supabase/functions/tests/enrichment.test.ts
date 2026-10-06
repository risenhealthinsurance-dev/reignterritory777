import { describe, expect, it, vi } from "vitest";
import { createConnectorCatalog, runConnectors, type SourceConnector } from "../_shared/sources";

describe("runConnectors", () => {
  it("stores provenance-ready observations and preserves partial success", async () => {
    const connectors: SourceConnector[] = [
      {
        id: "census",
        lookup: async () => [
          {
            field: "address",
            value: "100 Main St, Fort Pierce, FL 34950",
            sourceUrl: "https://geocoding.geo.census.gov/geocoder/",
            sourceRecordId: "match-1",
            confidence: 0.98,
            rawPayload: { matchedAddress: "100 MAIN ST" },
          },
        ],
      },
      {
        id: "nppes",
        lookup: async () => {
          throw Object.assign(new Error("rate limited"), { code: "rate_limited" });
        },
      },
    ];

    const result = await runConnectors(
      connectors,
      { name: "Apex Medical", address: "100 Main St", website: "https://apex.test" },
      "2026-10-04T14:30:00.000Z",
    );

    expect(result.observations).toEqual([
      expect.objectContaining({
        sourceId: "census",
        sourceUrl: "https://geocoding.geo.census.gov/geocoder/",
        retrievedAt: "2026-10-04T14:30:00.000Z",
        rawPayload: { matchedAddress: "100 MAIN ST" },
      }),
    ]);
    expect(result.attempts).toEqual([
      { sourceId: "census", status: "success", observationCount: 1 },
      {
        sourceId: "nppes",
        status: "rate_limited",
        observationCount: 0,
        message: "rate limited",
      },
    ]);
  });

  it("registers every approved source with a stable identifier", () => {
    const ids = createConnectorCatalog(async () => new Response("{}", { status: 200 })).map(
      (connector) => connector.id,
    );
    expect(ids).toEqual([
      "official-website",
      "census",
      "osm",
      "nppes",
      "gleif",
      "sec-edgar",
      "icann-rdap",
      "sam-gov",
    ]);
  });

  it("blocks private-network official website URLs before fetching", async () => {
    const fetcher = vi.fn();
    const officialWebsite = createConnectorCatalog(fetcher)[0];

    await expect(
      officialWebsite.lookup({ name: "Unsafe", website: "http://127.0.0.1/admin" }),
    ).rejects.toMatchObject({ code: "policy_blocked" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
