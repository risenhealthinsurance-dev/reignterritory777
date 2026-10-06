import type { AgentAction, AgentActionType } from "../contracts/fieldAgent";

const now = () => new Date().toISOString();
const id = () => `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createAgentAction(input: { type: AgentActionType; accountId?: string; payload: unknown; sourceMessageId: string }): AgentAction {
  return { ...input, id: id(), status: "proposed", createdAt: now() };
}

export async function confirmAgentAction(action: AgentAction, writer: (action: AgentAction) => Promise<unknown>): Promise<AgentAction> {
  if (action.status !== "proposed") return action;
  const confirmed = { ...action, status: "confirmed" as const, confirmedAt: now() };
  try { await writer(confirmed); return { ...confirmed, status: "completed", completedAt: now() }; }
  catch (error) { return { ...confirmed, status: "failed", error: error instanceof Error ? error.message : "Action failed" }; }
}

export function cancelAgentAction(action: AgentAction): AgentAction { return action.status === "proposed" ? { ...action, status: "cancelled" } : action; }
export function queueAgentAction(action: AgentAction): AgentAction { return action.status === "proposed" || action.status === "confirmed" ? { ...action, status: "queued" } : action; }
export async function replayQueuedActions(actions: AgentAction[], writer: (action: AgentAction) => Promise<unknown>): Promise<AgentAction[]> {
  return Promise.all(actions.map((action) => action.status === "queued" ? confirmAgentAction({ ...action, status: "proposed" }, writer) : action));
}
