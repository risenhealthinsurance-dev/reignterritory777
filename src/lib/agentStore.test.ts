import { describe, expect, it, beforeEach } from "vitest";
import { appendAgentMessage, getAgentSession, listAgentActions, replayStoredAgentActions, saveAgentAction, getQueuedActions } from "./agentStore";

describe("field agent persistence", () => {
  beforeEach(() => localStorage.clear());
  it("persists session messages and proposed actions", () => {
    appendAgentMessage("s1", { id: "m1", role: "user", content: "brief", createdAt: "2026-10-06T12:00:00Z" });
    saveAgentAction({ id: "a1", type: "schedule_follow_up", status: "queued", payload: {}, sourceMessageId: "m1", createdAt: "2026-10-06T12:00:00Z" });
    expect(getAgentSession("s1").messages).toHaveLength(1);
    expect(getQueuedActions()).toHaveLength(1);
  });

  it("replays accepted actions and preserves actions whose writer fails", async () => {
    saveAgentAction({ id: "accepted", type: "save_visit_note", status: "queued", payload: {}, sourceMessageId: "m1", createdAt: "2026-10-06T12:00:00Z" });
    saveAgentAction({ id: "retry", type: "record_disposition", status: "queued", payload: {}, sourceMessageId: "m2", createdAt: "2026-10-06T12:00:00Z" });
    const accepted = await replayStoredAgentActions(async (action) => {
      if (action.id === "retry") throw new Error("offline");
      return { ...action, status: "completed" };
    });
    expect(accepted.map((action) => action.id)).toEqual(["accepted"]);
    expect(listAgentActions()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted", status: "completed" }),
      expect.objectContaining({ id: "retry", status: "queued" }),
    ]));
  });
});
