import { describe, expect, it } from "vitest";
import { OfflineMutationQueue } from "./offlineQueue";

describe("OfflineMutationQueue", () => {
  it("replays an idempotent mutation once and reports version conflicts", async () => {
    const queue = new OfflineMutationQueue();
    const item = queue.enqueue({ type: "visit_note", payload: { accountId: "apex" }, version: 2 });
    const apply = async () => ({ status: "applied" as const });
    expect(await queue.replay(apply)).toEqual([{ id: item.id, status: "applied" }]);
    expect(await queue.replay(apply)).toEqual([]);

    const second = queue.enqueue({ type: "profile_edit", payload: {}, version: 3 });
    expect(await queue.replay(async (mutation) => ({
      status: "conflict" as const,
      id: mutation.id,
    }))).toEqual([{ id: second.id, status: "conflict" }]);
  });
});
