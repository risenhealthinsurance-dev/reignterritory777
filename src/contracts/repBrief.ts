export const REP_BRIEF_CONTRACT_VERSION = "1" as const;

export type BriefConfidence = "high" | "medium" | "low" | "unknown";
export type EnrichmentStatus = "enriched" | "partial" | "unavailable";

export interface BriefSignal {
  label: string;
  value: string;
  source?: string;
  observedAt?: string;
}

export interface BriefEvidence extends BriefSignal {
  confidence?: BriefConfidence;
}

export interface RepAccountBrief {
  businessId: string;
  name: string;
  category?: string;
  address?: string;
  zip?: string;
  quadrant?: string;
  coordinates?: { latitude: number; longitude: number };
  phone?: string;
  website?: string;
  routeOrder?: number;
  distanceMiles?: number;
  priorityScore?: number;
  whyThisAccount?: string[];
  fitReasons?: string[];
  supplyCategories?: string[];
  publicSignals?: BriefSignal[];
  confidence: BriefConfidence;
  freshness?: string;
  enrichmentStatus: EnrichmentStatus;
  suggestedOpener?: string;
  recommendedAction?: string;
  evidence?: BriefEvidence[];
}

export interface RepBriefResponse {
  contractVersion: typeof REP_BRIEF_CONTRACT_VERSION;
  generatedAt: string;
  expiresAt?: string;
  territory: { zip: string; quadrant?: string };
  accounts: RepAccountBrief[];
  coverage: { discovered: number; enriched: number; remaining?: number };
  warnings: Array<{ code: string; message: string }>;
}
