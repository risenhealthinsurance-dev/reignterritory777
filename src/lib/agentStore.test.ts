import { describe, expect, it, beforeEach } from "vitest";
import { appendAgentMessage, getAgentSession, saveAgentAction, getQueuedActions } from "./agentStore";

describe("field agent persistence", () => {
  beforeEach(() => localStorage.clear());
  it("persists session messages and proposed actions", () => {
    appendAgentMessage("s1", { id: "m1", role: "user", content: "brief", createdAt: "2026-10-06T12:00:00Z" });
    saveAgentAction({ id: "a1", type: "schedule_follow_up", status: "queued", payload: {}, sourceMessageId: "m1", createdAt: "2026-10-06T12:00:00Z" });
    expect(getAgentSession("s1").messages).toHaveLength(1);
    expect(getQueuedActions()).toHaveLength(1);
  });
});
