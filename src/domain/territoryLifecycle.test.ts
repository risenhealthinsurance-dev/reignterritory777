import { describe, expect, it } from "vitest";
import { canCreateTerritory, checkTerritoryLock, isTerritoryProtected, territoryLockExpiresAt, territoriesOverlap } from "./territoryLifecycle";

const box = (west: number, south: number, east: number, north: number) => [{ lat: south, lng: west }, { lat: south, lng: east }, { lat: north, lng: east }, { lat: north, lng: west }];

describe("territory lifecycle", () => {
  it("rejects overlapping drawn territory bounds", () => {
    expect(territoriesOverlap(box(0, 0, 2, 2), box(1, 1, 3, 3))).toBe(true);
    expect(canCreateTerritory(box(3, 3, 4, 4), [{ id: "old", boundary: box(0, 0, 2, 2), status: "locked" }])).toBe(true);
  });
  it("requires completed quadrants and no unresolved follow-ups", () => {
    expect(checkTerritoryLock(3, 4, 0)).toMatchObject({ canLock: false });
    expect(checkTerritoryLock(4, 4, 1)).toMatchObject({ canLock: false });
    expect(checkTerritoryLock(4, 4, 0)).toMatchObject({ canLock: true, reasons: [] });
  });
  it("protects a territory for three months from explicit lock", () => {
    const lockedAt = "2026-01-15T12:00:00.000Z";
    expect(territoryLockExpiresAt(lockedAt)).toBe("2026-04-15T12:00:00.000Z");
    expect(isTerritoryProtected({ id: "t1", boundary: box(0, 0, 1, 1), status: "locked", lockedAt }, new Date("2026-03-01T00:00:00.000Z"))).toBe(true);
  });
});
