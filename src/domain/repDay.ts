import { accounts } from "../data/accounts";
import { initialStops } from "../data/territory";
import type { StopRecord, StopResolution } from "../types";

export interface DayStop extends StopRecord {
  resolution: StopResolution;
  hardCommitment: boolean;
  expectedValue: number;
  travelMinutes: number;
  scheduledTime: string;
  resolutionDetail?: string;
  mutatedAt?: Date;
}

export interface RouteImpactMetrics {
  commitmentDelta: number;
  travelMinutesDelta: number;
  expectedValueDelta: number;
  projectedFinish: string;
}

export interface RouteProposal {
  id: string;
  proposedStopIds: string[];
  metrics: RouteImpactMetrics;
  warnings: string[];
}

export interface RepDay {
  territoryId: "ft-pierce-34950";
  selectedQuadrantId: string;
  recommendedQuadrantId: "A1";
  routeStopIds: string[];
  currentStopId: string | null;
  stops: DayStop[];
  routeProposal: RouteProposal | null;
  closedAt: Date | null;
  closeoutSyncState: "open" | "closed_on_device" | "fully_synced";
}

const ROUTE_META: Record<
  string,
  { hardCommitment: boolean; travelMinutes: number; scheduledTime: string }
> = {
  meridian: { hardCommitment: true, travelMinutes: 8, scheduledTime: "9:15 AM" },
  pacific: { hardCommitment: true, travelMinutes: 10, scheduledTime: "10:05 AM" },
  apex: { hardCommitment: false, travelMinutes: 12, scheduledTime: "11:15 AM" },
  solano: { hardCommitment: true, travelMinutes: 9, scheduledTime: "12:10 PM" },
  westside: { hardCommitment: false, travelMinutes: 7, scheduledTime: "1:05 PM" },
  bravo: { hardCommitment: false, travelMinutes: 11, scheduledTime: "2:00 PM" },
};

export function createInitialRepDay(): RepDay {
  const stops = initialStops.map<DayStop>((stop) => {
    const account = accounts.find((candidate) => candidate.id === stop.accountId);
    const meta = ROUTE_META[stop.accountId];
    return {
      ...stop,
      syncStatus: stop.status === "failed" || stop.status === "skipped" ? stop.syncStatus : "synced",
      resolution: stop.status === "done" ? "completed" : "unresolved",
      hardCommitment: meta.hardCommitment,
      expectedValue: account?.revenue ?? 0,
      travelMinutes: meta.travelMinutes,
      scheduledTime: meta.scheduledTime,
    };
  });

  return {
    territoryId: "ft-pierce-34950",
    selectedQuadrantId: "A1",
    recommendedQuadrantId: "A1",
    routeStopIds: stops.map((stop) => stop.accountId),
    currentStopId: "apex",
    stops,
    routeProposal: null,
    closedAt: null,
    closeoutSyncState: "open",
  };
}

function routeTotals(day: RepDay, ids: string[]) {
  return ids.reduce(
    (totals, id) => {
      const stop = day.stops.find((candidate) => candidate.accountId === id);
      if (stop) {
        totals.travelMinutes += stop.travelMinutes;
        totals.expectedValue += stop.expectedValue;
      }
      return totals;
    },
    { travelMinutes: 0, expectedValue: 0 },
  );
}

function finishTime(deltaMinutes: number) {
  const total = 16 * 60 + 42 + deltaMinutes;
  const hour24 = Math.floor(total / 60);
  const minutes = total % 60;
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  return `${hour12}:${minutes.toString().padStart(2, "0")} PM`;
}

export function previewRouteChange(day: RepDay, proposedStopIds: string[]): RouteProposal {
  const unknown = proposedStopIds.find(
    (id) => !day.stops.some((candidate) => candidate.accountId === id),
  );
  if (unknown) throw new Error(`Unknown stop: ${unknown}`);
  if (new Set(proposedStopIds).size !== proposedStopIds.length) {
    throw new Error("A route proposal cannot contain duplicate stops");
  }

  const before = routeTotals(day, day.routeStopIds);
  const after = routeTotals(day, proposedStopIds);
  const warnings: string[] = [];
  let commitmentDelta = 0;
  for (const stop of day.stops.filter((candidate) => candidate.hardCommitment)) {
    const oldIndex = day.routeStopIds.indexOf(stop.accountId);
    const newIndex = proposedStopIds.indexOf(stop.accountId);
    if (newIndex !== oldIndex) {
      commitmentDelta -= 1;
      const account = accounts.find((candidate) => candidate.id === stop.accountId);
      warnings.push(`${account?.name ?? stop.accountId} has a protected commitment`);
    }
  }
  const travelMinutesDelta = after.travelMinutes - before.travelMinutes;

  return {
    id: `proposal:${proposedStopIds.join(">")}`,
    proposedStopIds: [...proposedStopIds],
    metrics: {
      commitmentDelta,
      travelMinutesDelta,
      expectedValueDelta: after.expectedValue - before.expectedValue,
      projectedFinish: finishTime(travelMinutesDelta),
    },
    warnings,
  };
}

export function applyRouteChange(day: RepDay, proposalId: string): RepDay {
  if (!day.routeProposal || day.routeProposal.id !== proposalId) {
    throw new Error("The route proposal must be reviewed before it can be applied");
  }
  return {
    ...day,
    routeStopIds: [...day.routeProposal.proposedStopIds],
    routeProposal: null,
  };
}

export function getSyncQueue(day: RepDay) {
  return day.stops.filter((stop) =>
    ["local_only", "queued", "syncing", "error"].includes(stop.syncStatus),
  );
}

export type StopResolutionInput =
  | { kind: "tomorrow" }
  | { kind: "territory_pool" }
  | { kind: "reloop"; date: string }
  | { kind: "closed"; reason: string };

export function resolveStop(
  day: RepDay,
  accountId: string,
  resolution: StopResolutionInput,
): RepDay {
  if (!day.stops.some((stop) => stop.accountId === accountId)) {
    throw new Error(`Unknown stop: ${accountId}`);
  }
  return {
    ...day,
    stops: day.stops.map((stop) =>
      stop.accountId === accountId
        ? {
            ...stop,
            resolution: resolution.kind,
            resolutionDetail:
              resolution.kind === "reloop"
                ? resolution.date
                : resolution.kind === "closed"
                  ? resolution.reason
                  : undefined,
            syncStatus: "local_only",
            mutatedAt: new Date(),
          }
        : stop,
    ),
  };
}
