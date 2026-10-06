import { describe, expect, it } from "vitest";
import { isAllowedTool, validateToolCall } from "./toolRegistry";

describe("Field AI tool registry", () => {
  it("allows only the typed tool allowlist", () => {
    expect(isAllowedTool("get_current_stop")).toBe(true);
    expect(isAllowedTool("run_shell")).toBe(false);
  });
  it("requires confirmation for writes", () => {
    expect(validateToolCall("schedule_follow_up", false).ok).toBe(false);
    expect(validateToolCall("schedule_follow_up", true).ok).toBe(true);
  });
});
