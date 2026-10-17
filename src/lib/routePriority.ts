import type { AgentAction } from "../contracts/fieldAgent";
import type { Account } from "../data/accounts";

function scheduledAt(action: AgentAction) {
  if (action.type !== "schedule_follow_up" || (action.status !== "queued" && action.status !== "completed")) return Number.POSITIVE_INFINITY;
  const payload = action.payload && typeof action.payload === "object" ? action.payload as { date?: unknown; time?: unknown } : {};
  if (typeof payload.date !== "string" || typeof payload.time !== "string") return Number.POSITIVE_INFINITY;
  const value = Date.parse(`${payload.date}T${payload.time}`);
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

export function prioritizeRouteStopIds(businesses: Account[], actions: AgentAction[]) {
  const scheduleByAccount = new Map<string, number>();
  for (const action of actions) {
    if (!action.accountId) continue;
    const timestamp = scheduledAt(action);
    if (timestamp === Number.POSITIVE_INFINITY) continue;
    const current = scheduleByAccount.get(action.accountId);
    if (current === undefined || timestamp < current) scheduleByAccount.set(action.accountId, timestamp);
  }
  return [...businesses]
    .sort((first, second) => (scheduleByAccount.get(first.id) ?? Number.POSITIVE_INFINITY) - (scheduleByAccount.get(second.id) ?? Number.POSITIVE_INFINITY) || first.routeOrder - second.routeOrder)
    .map((business) => business.id);
}
