import type { AgentAction } from "../contracts/fieldAgent";
import type { Account } from "../data/accounts";

function scheduledAt(action: AgentAction) {
  if (action.type !== "schedule_follow_up" || (action.status !== "queued" && action.status !== "completed")) return Number.POSITIVE_INFINITY;
  const payload = action.payload && typeof action.payload === "object" ? action.payload as { date?: unknown; time?: unknown; kind?: unknown; endTime?: unknown } : {};
  if (typeof payload.date !== "string" || typeof payload.time !== "string") return Number.POSITIVE_INFINITY;
  const value = Date.parse(`${payload.date}T${payload.time}`);
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function scheduleRank(action: AgentAction) {
  if (action.type !== "schedule_follow_up" || (action.status !== "queued" && action.status !== "completed")) return 2;
  const payload = action.payload && typeof action.payload === "object" ? action.payload as { kind?: unknown; endTime?: unknown } : {};
  // Hard appointments are protected; flexible windows stay ahead of new doors but can move within their window.
  return payload.kind === "hard_appointment" || (payload.kind === undefined && payload.endTime === undefined) ? 0 : 1;
}

export function findNextScheduledAction(actions: AgentAction[], accountId: string) {
  return actions
    .filter((action) => action.accountId === accountId && scheduledAt(action) !== Number.POSITIVE_INFINITY)
    .sort((first, second) => scheduledAt(first) - scheduledAt(second))[0] ?? null;
}

export function findLatestDispositionAction(actions: AgentAction[], accountId: string) {
  return actions
    .filter((action) => action.accountId === accountId && action.type === "record_disposition" && (action.status === "queued" || action.status === "completed"))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))[0] ?? null;
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
    .sort((first, second) => {
      const firstAction = actions.find((action) => action.accountId === first.id && scheduledAt(action) === scheduleByAccount.get(first.id));
      const secondAction = actions.find((action) => action.accountId === second.id && scheduledAt(action) === scheduleByAccount.get(second.id));
      return scheduleRank(firstAction ?? ({ type: "record_disposition", status: "queued" } as AgentAction)) - scheduleRank(secondAction ?? ({ type: "record_disposition", status: "queued" } as AgentAction))
        || (scheduleByAccount.get(first.id) ?? Number.POSITIVE_INFINITY) - (scheduleByAccount.get(second.id) ?? Number.POSITIVE_INFINITY)
        || first.routeOrder - second.routeOrder;
    })
    .map((business) => business.id);
}
