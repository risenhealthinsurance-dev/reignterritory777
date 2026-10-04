import { describe, expect, test } from "vitest";
import { accounts } from "../data/accounts";
import { QUADRANTS } from "../data/territory_grid";
import {
  applyRouteChange,
  closeRepDay,
  createInitialRepDay,
  getSyncQueue,
  previewRouteChange,
  recordCorrection,
  resolveStop,
} from "./repDay";

describe("field-day domain", () => {
  test("uses one coherent Fort Pierce 34950 geography", () => {
    expect(accounts).toHaveLength(6);
    for (const account of accounts) {
      expect(account.address).toMatch(/Fort Pierce, FL 34950$/);
      expect(account.lat).toBeGreaterThan(27.3);
      expect(account.lat).toBeLessThan(27.6);
      expect(account.lng).toBeGreaterThan(-80.5);
      expect(account.lng).toBeLessThan(-80.2);
    }
    expect(QUADRANTS.every((quadrant) => quadrant.status !== "locked")).toBe(true);
  });

  test("previews route impact without changing the committed route", () => {
    const day = createInitialRepDay();
    const proposedIds = ["meridian", "apex", "pacific", "solano", "bravo"];

    const preview = previewRouteChange(day, proposedIds);

    expect(day.routeStopIds).not.toEqual(proposedIds);
    expect(preview.proposedStopIds).toEqual(proposedIds);
    expect(preview.metrics).toEqual(
      expect.objectContaining({
        commitmentDelta: expect.any(Number),
        travelMinutesDelta: expect.any(Number),
        expectedValueDelta: expect.any(Number),
        projectedFinish: expect.stringMatching(/PM$/),
      }),
    );
    expect(preview.warnings).toContain("Pacific Rim Logistics has a protected commitment");
  });

  test("applies only the last approved route proposal", () => {
    const day = createInitialRepDay();
    const preview = previewRouteChange(day, ["meridian", "pacific", "solano", "apex"]);

    expect(() => applyRouteChange(day, "wrong-proposal")).toThrow(/proposal/i);

    const applied = applyRouteChange({ ...day, routeProposal: preview }, preview.id);
    expect(applied.routeStopIds).toEqual(preview.proposedStopIds);
    expect(applied.routeProposal).toBeNull();
  });

  test("keeps untouched stops unresolved and out of the sync queue", () => {
    const day = createInitialRepDay();

    expect(day.stops.filter((stop) => stop.resolution === "unresolved")).toHaveLength(4);
    expect(getSyncQueue(day).map((stop) => stop.accountId)).toEqual(["westside"]);

    const resolved = resolveStop(day, "apex", { kind: "tomorrow" });
    expect(getSyncQueue(resolved).map((stop) => stop.accountId)).toEqual(["apex", "westside"]);
    expect(resolved.stops.find((stop) => stop.accountId === "apex")?.resolution).toBe("tomorrow");
  });

  test("blocks closeout until all stops are resolved, then distinguishes device close from sync", () => {
    let day = createInitialRepDay();
    expect(() => closeRepDay(day, new Date(), true)).toThrow(/unfinished/i);
    for (const stop of day.stops.filter((candidate) => candidate.resolution === "unresolved")) {
      day = resolveStop(day, stop.accountId, { kind: "territory_pool" });
    }
    const closed = closeRepDay(day, new Date("2026-10-04T17:00:00-04:00"), true);
    expect(closed.closeoutSyncState).toBe("closed_on_device");
    expect(closed.closedAt).not.toBeNull();
  });

  test("post-close corrections append an audit record and requeue the stop", () => {
    const day = { ...createInitialRepDay(), closedAt: new Date() };
    const corrected = recordCorrection(day, {
      accountId: "meridian",
      field: "nextAction",
      before: "Send specs",
      after: "Call purchasing",
      reason: "Manager confirmed by phone",
    });
    expect(corrected.corrections).toHaveLength(1);
    expect(corrected.corrections[0]).toEqual(
      expect.objectContaining({ accountId: "meridian", reason: "Manager confirmed by phone" }),
    );
    expect(corrected.stops.find((stop) => stop.accountId === "meridian")?.syncStatus).toBe(
      "local_only",
    );
  });
});
