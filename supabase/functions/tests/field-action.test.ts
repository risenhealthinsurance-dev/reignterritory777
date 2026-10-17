import { describe, expect, it } from "vitest";
import { validateFieldAction } from "../_shared/fieldActionSchema";

const validAction = {
  id: "action-1",
  type: "schedule_follow_up",
  status: "queued",
  accountId: "11111111-1111-4111-8111-111111111111",
  payload: { date: "2026-10-22", time: "14:00", appointmentType: "hard" },
  sourceMessageId: "message-1",
  createdAt: "2026-10-17T00:00:00.000Z",
};

describe("field action validation", () => {
  it("accepts an approved action with a live business UUID", () => {
    expect(validateFieldAction(validAction)).toEqual(validAction);
  });

  it("rejects arbitrary action types and local fixture IDs", () => {
    expect(() => validateFieldAction({ ...validAction, type: "run_code" })).toThrow(/unsupported/i);
    expect(() => validateFieldAction({ ...validAction, accountId: "apex" })).toThrow(/UUID/i);
  });

  it("rejects actions that are not queued or confirmed", () => {
    expect(() => validateFieldAction({ ...validAction, status: "completed" })).toThrow(/status/i);
  });
});
