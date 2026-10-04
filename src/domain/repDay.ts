import { accounts } from "../data/accounts";
import { initialStops } from "../data/territory";
import type { DraftDisposition, StopRecord, StopResolution } from "../types";

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

export interface CorrectionRecord {
  id: string;
  accountId: string;
  field: "nextAction" | "dispositionNote" | "resolution";
  before: string;
  after: string;
  reason: string;
  correctedAt: Date;
  author: string;
  requiresManagerReview: boolean;
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
  corrections: CorrectionRecord[];
  managerSummaryDraft: string;
  managerSummarySentAt: Date | null;
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
    const syncStatus =
      stop.status === "failed" || stop.status === "skipped" ? stop.syncStatus : "synced";
    return {
      ...stop,
      syncStatus,
      mutatedAt: syncStatus === "synced" ? undefined : new Date("2026-10-04T13:18:00.000-04:00"),
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
    corrections: [],
    managerSummaryDraft:
      "Fort Pierce 34950 field day handoff: review completed visits, unresolved work, and queued records before sending.",
    managerSummarySentAt: null,
  };
}

function routeTotals(day: RepDay, ids: string[]) {
  let previous = { lat: 27.44, lng: -80.337 };
  return ids.reduce(
    (totals, id) => {
      const stop = day.stops.find((candidate) => candidate.accountId === id);
      const account = accounts.find((candidate) => candidate.id === id);
      if (stop && account) {
        const latMiles = (account.lat - previous.lat) * 69;
        const lngMiles = (account.lng - previous.lng) * 61;
        totals.travelMinutes += Math.max(2, Math.round(Math.hypot(latMiles, lngMiles) * 3.2));
        totals.expectedValue += stop.expectedValue;
        previous = account;
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
    currentStopId:
      day.currentStopId && day.routeProposal.proposedStopIds.includes(day.currentStopId)
        ? day.currentStopId
        : (day.routeProposal.proposedStopIds.find((id) => {
            const stop = day.stops.find((candidate) => candidate.accountId === id);
            return stop?.status === "pending" || stop?.status === "active";
          }) ?? null),
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

export function closeRepDay(day: RepDay, closedAt: Date, isOffline: boolean): RepDay {
  if (day.stops.some((stop) => stop.resolution === "unresolved")) {
    throw new Error("Resolve every unfinished stop before closing the day");
  }
  return {
    ...day,
    closedAt,
    closeoutSyncState:
      isOffline || getSyncQueue(day).length > 0 ? "closed_on_device" : "fully_synced",
  };
}

export type CorrectionInput = Omit<
  CorrectionRecord,
  "id" | "correctedAt" | "author" | "requiresManagerReview"
> & {
  author?: string;
  requiresManagerReview?: boolean;
};

export function recordCorrection(day: RepDay, input: CorrectionInput): RepDay {
  if (!day.closedAt) throw new Error("Corrections become available after closeout");
  if (!input.reason.trim()) throw new Error("An audit reason is required");
  if (!day.stops.some((stop) => stop.accountId === input.accountId)) {
    throw new Error(`Unknown stop: ${input.accountId}`);
  }
  const correctedAt = new Date();
  return {
    ...day,
    corrections: [
      ...day.corrections,
      {
        ...input,
        id: `correction:${input.accountId}:${correctedAt.getTime()}`,
        correctedAt,
        author: input.author ?? "Field rep",
        requiresManagerReview: input.requiresManagerReview ?? true,
      },
    ],
    closeoutSyncState: "closed_on_device",
    stops: day.stops.map((stop) =>
      stop.accountId === input.accountId
        ? { ...stop, [input.field]: input.after, syncStatus: "local_only", mutatedAt: correctedAt }
        : stop,
    ),
  };
}

function nextActionableStopId(day: RepDay, afterAccountId: string) {
  const afterIndex = day.routeStopIds.indexOf(afterAccountId);
  const ordered = [
    ...day.routeStopIds.slice(afterIndex + 1),
    ...day.routeStopIds.slice(0, afterIndex + 1),
  ];
  return (
    ordered.find((id) => {
      const stop = day.stops.find((candidate) => candidate.accountId === id);
      return stop?.status === "pending" || stop?.status === "active";
    }) ?? null
  );
}

export function completeVisit(
  day: RepDay,
  draft: DraftDisposition,
  mutatedAt = new Date(),
): RepDay {
  const nextDay = {
    ...day,
    stops: day.stops.map((stop) =>
      stop.accountId === draft.stopId
        ? {
            ...stop,
            status: "done" as const,
            disposition: draft.outcome ?? undefined,
            dispositionNote: draft.note,
            nextAction: draft.nextAction,
            departedAt: mutatedAt,
            syncStatus: "local_only" as const,
            resolution: "completed" as const,
            mutatedAt,
          }
        : stop,
    ),
  };
  return { ...nextDay, currentStopId: nextActionableStopId(nextDay, draft.stopId) };
}

export function failVisit(
  day: RepDay,
  accountId: string,
  failureReason?: string,
  recoveryPlan?: "skip" | "reloop" | "call_ahead",
  mutatedAt = new Date(),
): RepDay {
  const nextDay = {
    ...day,
    stops: day.stops.map((stop) =>
      stop.accountId === accountId
        ? {
            ...stop,
            status: "failed" as const,
            failureReason,
            recoveryPlan,
            syncStatus: "local_only" as const,
            mutatedAt,
          }
        : stop,
    ),
  };
  return { ...nextDay, currentStopId: nextActionableStopId(nextDay, accountId) };
}

export function updateManagerSummary(day: RepDay, draft: string): RepDay {
  return { ...day, managerSummaryDraft: draft, managerSummarySentAt: null };
}

export function sendManagerSummary(day: RepDay, sentAt = new Date()): RepDay {
  if (!day.closedAt) throw new Error("Close the day before sending the manager handoff");
  return { ...day, managerSummarySentAt: sentAt };
}
