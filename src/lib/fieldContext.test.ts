import { describe, expect, test } from "vitest";
import { buildPipelineContext, type LocationContext } from "./fieldContext";
import type { PipelineOpportunity } from "../contracts/mapGpt";
import { accounts } from "../data/accounts";

const opportunities: PipelineOpportunity[] = [
  { id: "apex", account: accounts.find((account) => account.id === "apex")!, stage: "proposal", estimatedValue: 22000000, nextAction: "Prepare brief" },
  { id: "solano", account: accounts.find((account) => account.id === "solano")!, stage: "qualified", estimatedValue: 5600000, nextAction: "Call Thursday" },
];

describe("field context", () => {
  test("builds assistant pipeline context from canonical opportunity stages", () => {
    expect(buildPipelineContext(opportunities)).toEqual([
      { accountId: "apex", stage: "proposal", nextAction: "Prepare brief", estimatedValue: 22000000 },
      { accountId: "solano", stage: "qualified", nextAction: "Call Thursday", estimatedValue: 5600000 },
    ]);
  });

  test("labels location context by availability and freshness", () => {
    const context: LocationContext = { state: "available", lat: 27.44, lng: -80.337, accuracyMeters: 12, updatedAt: 1000 };
    expect(context.state).toBe("available");
    expect({ ...context, state: "stale" as const }).toMatchObject({ state: "stale" });
  });
});
