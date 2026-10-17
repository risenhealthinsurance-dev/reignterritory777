import { describe, expect, it } from "vitest";
import type { AgentAction } from "../contracts/fieldAgent";
import { accounts } from "../data/accounts";
import { findNextScheduledAction, prioritizeRouteStopIds } from "./routePriority";

const action = (accountId: string, date: string, time: string, status: AgentAction["status"] = "queued"): AgentAction => ({
  id: `${accountId}-${date}-${time}`,
  type: "schedule_follow_up",
  status,
  accountId,
  payload: { date, time },
  sourceMessageId: "message-1",
  createdAt: "2026-10-17T00:00:00.000Z",
});

describe("route priority", () => {
  it("puts the earliest scheduled callback first and keeps unscheduled stops after it", () => {
    expect(prioritizeRouteStopIds(accounts, [action("apex", "2026-10-20", "14:00"), action("meridian", "2026-10-20", "10:00")])).toEqual([
      "meridian",
      "apex",
      "pacific",
      "solano",
      "westside",
      "bravo",
    ]);
  });

  it("uses completed server-accepted schedules but ignores cancelled actions", () => {
    expect(prioritizeRouteStopIds(accounts, [action("apex", "2026-10-20", "09:00", "completed"), { ...action("meridian", "2026-10-20", "08:00"), status: "cancelled" }])).toEqual([
      "apex",
      "meridian",
      "pacific",
      "solano",
      "westside",
      "bravo",
    ]);
  });

  it("returns the next scheduled action for Pipeline display", () => {
    expect(findNextScheduledAction([action("apex", "2026-10-21", "14:00"), action("apex", "2026-10-20", "09:30")], "apex")).toMatchObject({
      payload: { date: "2026-10-20", time: "09:30" },
    });
  });
});
