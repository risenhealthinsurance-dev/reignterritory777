import type { PipelineOpportunity } from "../contracts/mapGpt";

export type LocationState = "pending" | "available" | "unavailable" | "stale";

export interface LocationContext {
  state: LocationState;
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
  updatedAt?: number;
}

export function buildPipelineContext(opportunities: PipelineOpportunity[]) {
  return opportunities.map((opportunity) => ({
    accountId: opportunity.account.id,
    stage: opportunity.stage,
    nextAction: opportunity.nextAction,
    estimatedValue: opportunity.estimatedValue,
  }));
}

export function locationStateLabel(context: LocationContext): string {
  if (context.state === "pending") return "Finding your location…";
  if (context.state === "unavailable") return "Live location unavailable";
  if (context.state === "stale") return "Location is stale — refresh before routing";
  if (context.accuracyMeters != null) return `Live location · ±${Math.round(context.accuracyMeters)}m`;
  return "Live location available";
}
