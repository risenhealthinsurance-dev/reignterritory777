import type { AgentAction, AgentMessage, ToolCall } from "../contracts/fieldAgent";

export interface AgentResponse { messageId: string; sessionId: string; text: string; toolCalls: ToolCall[]; warnings: string[]; proposedAction?: AgentAction; }

export async function sendFieldAIMessage(input: { message: string; accountId?: string | null; sessionId?: string }): Promise<AgentResponse> {
  const response = await fetch("/api/field-ai/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error(`Field AI unavailable (${response.status})`);
  return response.json() as Promise<AgentResponse>;
}

export function toAssistantMessage(response: AgentResponse): AgentMessage { return { id: response.messageId, role: "assistant", content: response.text, createdAt: new Date().toISOString() }; }
