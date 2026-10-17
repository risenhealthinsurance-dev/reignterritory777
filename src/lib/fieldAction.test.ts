import { describe, expect, it, vi } from "vitest";
import { createFieldActionClient } from "./fieldAction";

const action = {
  id: "action-1",
  type: "schedule_follow_up" as const,
  status: "queued" as const,
  accountId: "11111111-1111-4111-8111-111111111111",
  payload: { date: "2026-10-22", time: "14:00", appointmentType: "hard" },
  sourceMessageId: "message-1",
  createdAt: "2026-10-17T00:00:00.000Z",
};

describe("field action client", () => {
  it("replays through the named Supabase function and returns the accepted action", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { action: { ...action, status: "completed" } }, error: null });
    const result = await createFieldActionClient({ functions: { invoke } }).replay(action);
    expect(invoke).toHaveBeenCalledWith("field-action", { body: { operation: "replay", action } });
    expect(result.status).toBe("completed");
  });

  it("does not hide function errors", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: new Error("unauthorized") });
    await expect(createFieldActionClient({ functions: { invoke } }).replay(action)).rejects.toThrow("unauthorized");
  });
});
