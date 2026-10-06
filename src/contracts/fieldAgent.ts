export const FIELD_AGENT_CONTRACT_VERSION = "1" as const;

export type AgentActionType = "save_visit_note" | "record_disposition" | "schedule_follow_up" | "create_recovery_action" | "update_route";
export type AgentActionStatus = "proposed" | "confirmed" | "queued" | "completed" | "failed" | "cancelled";

export interface AgentAction {
  id: string;
  type: AgentActionType;
  status: AgentActionStatus;
  accountId?: string;
  payload: unknown;
  sourceMessageId: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  error?: string;
}

export type AgentCard =
  | { type: "account_brief"; accountId: string; title: string; source: "live" | "cache" | "fixture"; freshness: string; facts: string[]; inferences: string[]; unknowns: string[] }
  | { type: "action_preview"; action: AgentAction; title: string; summary: string };

export interface AgentMessage { id: string; role: "user" | "assistant"; content: string; createdAt: string; }
export interface ToolCall { id: string; name: string; args: Record<string, unknown>; status: "pending" | "completed" | "failed"; result?: unknown; }
