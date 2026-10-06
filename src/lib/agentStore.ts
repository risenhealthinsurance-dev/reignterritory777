import type { AgentAction, AgentMessage } from "../contracts/fieldAgent";

const SESSION_KEY = "reign-territory:field-ai:sessions:v1";
const ACTION_KEY = "reign-territory:field-ai:actions:v1";
type Session = { id: string; messages: AgentMessage[]; updatedAt: string };
const read = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export function getAgentSession(id: string): Session { return read<Record<string, Session>>(SESSION_KEY, {})[id] || { id, messages: [], updatedAt: new Date().toISOString() }; }
export function appendAgentMessage(id: string, message: AgentMessage) { const sessions = read<Record<string, Session>>(SESSION_KEY, {}); const current = getAgentSession(id); sessions[id] = { ...current, messages: [...current.messages, message], updatedAt: new Date().toISOString() }; write(SESSION_KEY, sessions); }
export function saveAgentAction(action: AgentAction) { const actions = read<AgentAction[]>(ACTION_KEY, []); const index = actions.findIndex((item) => item.id === action.id); if (index >= 0) actions[index] = action; else actions.push(action); write(ACTION_KEY, actions); }
export function getQueuedActions() { return read<AgentAction[]>(ACTION_KEY, []).filter((action) => action.status === "queued"); }
export function listAgentActions() { return read<AgentAction[]>(ACTION_KEY, []); }
