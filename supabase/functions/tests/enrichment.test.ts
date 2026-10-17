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
    const ids = createConnectorCatalog(async () => new Response("{}", { status: 200 }), { regridToken: "sandbox-token" }).map(
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
      "regrid",
    ]);
  });

  it("queries Regrid by address with a server-side token and preserves parcel provenance", async () => {
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      expect(input).toContain("https://app.regrid.com/api/v2/parcels/address?");
      expect(input).toContain("query=100+Main+St%2C+Fort+Pierce%2C+FL+34950");
      expect(input).toContain("limit=1");
      expect(input).not.toContain("sandbox-token");
      expect(new Headers(init?.headers).get("x-regrid-token")).toBe("sandbox-token");
      return new Response(JSON.stringify({ features: [{ id: "parcel-1", properties: { ll_uuid: "parcel-1", owner: "Example Holdings" }, geometry: null }] }), { status: 200 });
    });
    const regrid = createConnectorCatalog(fetcher, { regridToken: "sandbox-token" }).find((connector) => connector.id === "regrid");
    expect(regrid).toBeDefined();
    const records = await regrid!.lookup({ name: "Example Holdings", address: "100 Main St, Fort Pierce, FL 34950" });
    expect(records).toEqual([
      expect.objectContaining({
        field: "regrid_parcel",
        sourceRecordId: "parcel-1",
        sourceUrl: "https://app.regrid.com/api/v2/parcels/address",
        value: { ll_uuid: "parcel-1", owner: "Example Holdings" },
      }),
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
