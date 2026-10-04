export type DrawerSnap = "peek" | "half" | "full";

export type AppScreen =
  | "kickoff"
  | "route"
  | "stop"
  | "disposition"
  | "followup"
  | "recovery"
  | "chat"
  | "summary"
  | "territory"
  | "quadrant"
  | "quad_route"
  | "enrichment";

export type QuadrantStatus = "active" | "available" | "completed" | "locked";
export type StopBadge = "new_door" | "reloop" | "follow_up" | "retention";
export type FindingStatus = "strong" | "partial" | "missing" | "unknown";
export type OpportunityLabel = "observed" | "publicly_supported" | "likely" | "needs_confirmation";
export type ConfidenceLevel = "high" | "medium" | "low";
export type Provenance = "public" | "crm" | "rep_observation" | "needs_confirmation";

export interface QuadrantContext {
  zipCode: string;
  quadrantId: string;
  stopIndex: number;
  totalStops: number;
}

export type SyncStatus = "synced" | "local_only" | "queued" | "syncing" | "error";

export type StopStatus = "pending" | "active" | "done" | "skipped" | "failed";

export type OutcomeKey =
  | "sold"
  | "callback"
  | "no_contact"
  | "not_interested"
  | "demo_set"
  | "left_info";

export interface StopRecord {
  accountId: string;
  status: StopStatus;
  disposition?: OutcomeKey;
  dispositionNote?: string;
  nextAction?: string;
  followUpDate?: string;
  followUpTime?: string;
  arrivedAt?: Date;
  visitStartedAt?: Date;
  departedAt?: Date;
  syncStatus: SyncStatus;
  failureReason?: string;
  recoveryPlan?: "skip" | "reloop" | "call_ahead";
}

export type StopResolution =
  | "unresolved"
  | "completed"
  | "tomorrow"
  | "territory_pool"
  | "reloop"
  | "closed";

export interface DraftDisposition {
  stopId: string;
  outcome: OutcomeKey | null;
  note: string;
  nextAction: string;
}

export interface FollowUpDraft {
  stopId: string;
  date: string;
  time: string;
  agenda: string;
}

export interface ToolCall {
  name: string;
  args: string;
  result?: string;
}

export interface RouteStop {
  accountId: string;
  name: string;
  address: string;
  etaMinutes: number;
  distanceMiles: number;
}

export interface RouteCardData {
  type: "route";
  stops: RouteStop[];
  totalMiles: number;
  totalMinutes: number;
}

export interface AccountCardData {
  type: "account";
  accountId: string;
}

export interface DispositionCardData {
  type: "disposition";
  accountId: string;
  selectedOutcome?: string;
  note?: string;
}

export interface FollowUpCardData {
  type: "followup";
  accountId: string;
  selectedDate?: string;
  selectedTime?: string;
}

export interface SummaryCardData {
  type: "summary";
  accountsVisited: number;
  callsLogged: number;
  salesMade: number;
  milesDriven: number;
  topAccounts: { name: string; outcome: string }[];
}

export type CardData =
  | RouteCardData
  | AccountCardData
  | DispositionCardData
  | FollowUpCardData
  | SummaryCardData;

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  card?: CardData;
  toolCalls?: ToolCall[];
  timestamp: Date;
}
