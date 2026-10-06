import { describe, expect, it } from "vitest";
import { createAgentAction, confirmAgentAction, cancelAgentAction, queueAgentAction, replayQueuedActions } from "./fieldAgent";

describe("Field AI action lifecycle", () => {
  it("creates proposed writes and confirms them once", async () => {
    const proposed = createAgentAction({ type: "save_visit_note", accountId: "apex", payload: { note: "Met buyer" }, sourceMessageId: "m1" });
    expect(proposed.status).toBe("proposed");
    const completed = await confirmAgentAction(proposed, async () => "saved");
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeTruthy();
  });

  it("cancels without executing the writer", async () => {
    const proposed = createAgentAction({ type: "schedule_follow_up", accountId: "apex", payload: {}, sourceMessageId: "m2" });
    const cancelled = cancelAgentAction(proposed);
    expect(cancelled.status).toBe("cancelled");
  });

  it("queues offline actions and replays them once", async () => {
    const proposed = createAgentAction({ type: "record_disposition", accountId: "apex", payload: {}, sourceMessageId: "m3" });
    const queued = queueAgentAction(proposed);
    expect(queued.status).toBe("queued");
    const replayed = await replayQueuedActions([queued], async () => "synced");
    expect(replayed[0].status).toBe("completed");
  });
});
