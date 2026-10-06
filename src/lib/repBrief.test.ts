import { describe, expect, it } from "vitest";
import { cacheRepBrief, readCachedRepBrief, normalizeRepBrief } from "./repBrief";

describe("rep brief resilience", () => {
  it("normalizes a valid OSINT response and caches it", () => {
    const response = normalizeRepBrief({ contractVersion: "1", generatedAt: "2026-10-06T12:00:00Z", territory: { zip: "34950" }, accounts: [], coverage: { discovered: 0, enriched: 0 }, warnings: [] });
    expect(response.contractVersion).toBe("1");
    cacheRepBrief(response);
    expect(readCachedRepBrief()?.territory.zip).toBe("34950");
  });

  it("rejects incompatible cache versions", () => {
    localStorage.setItem("reign-territory:rep-brief:v1", JSON.stringify({ contractVersion: "9" }));
    expect(readCachedRepBrief()).toBeNull();
  });
});
