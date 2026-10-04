export interface BusinessLookup {
  name: string;
  address?: string;
  website?: string;
  legalIdentifier?: string;
}

export interface ConnectorRecord {
  field: string;
  value: unknown;
  sourceUrl: string;
  sourceRecordId?: string;
  confidence: number;
  rawPayload: unknown;
}

export interface ProvenanceObservation extends ConnectorRecord {
  sourceId: string;
  retrievedAt: string;
}
