import { describe, expect, it, vi } from "vitest";
import { createFieldAiClient } from "./fieldAi";

describe("createFieldAiClient", () => {
  it("invokes the authenticated field-ai function with the exact request", async () => {
    const result = {
      status: "complete",
      answer: "Use the verified opening.",
      facts: [],
      inferences: [],
      uncertainties: [],
      confidence: "medium",
      suggestedActions: [],
    };
    const invoke = vi.fn().mockResolvedValue({ data: result, error: null });
    const client = createFieldAiClient({ functions: { invoke } });
    const request = {
      scope: { type: "account" as const, accountId: "apex" },
      intent: "brief" as const,
      idempotencyKey: "request-1",
    };

    await expect(client.ask(request)).resolves.toEqual(result);
    expect(invoke).toHaveBeenCalledWith("field-ai", { body: request });
  });

  it("maps provider quota failures without fabricating an answer", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { context: { json: () => Promise.resolve({ error: { code: "quota_exceeded" } }) } },
    });
    const client = createFieldAiClient({ functions: { invoke } });

    await expect(
      client.ask({
        scope: { type: "territory", territoryId: "ft-pierce-34950" },
        intent: "brief",
        idempotencyKey: "request-2",
      }),
    ).rejects.toMatchObject({ code: "quota_exceeded" });
  });
});
