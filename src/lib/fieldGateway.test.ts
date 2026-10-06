import { describe, expect, it } from "vitest";
import { toAssistantMessage } from "./fieldGateway";

describe("Field AI gateway", () => {
  it("converts a structured response into a session message", () => {
    const message = toAssistantMessage({ messageId: "m1", sessionId: "s1", text: "Ready", toolCalls: [], warnings: [] });
    expect(message.role).toBe("assistant");
    expect(message.content).toBe("Ready");
  });
});
