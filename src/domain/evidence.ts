export interface SourceObservation {
  id: string;
  entityId: string;
  field: string;
  value: string;
  sourceId: string;
  sourceUrl?: string;
  retrievedAt: string;
  confidence: number;
}

export interface RepCorrection {
  id: string;
  entityId: string;
  field: string;
  value: string;
  correctedAt: string;
  repId: string;
  reason: string;
}

export interface ResolvedFact {
  entityId: string;
  field: string;
  value: string;
  sourceObservationId?: string;
  correctionId?: string;
  verifiedByRep: boolean;
  observedAt: string;
}

export interface FactConflict {
  entityId: string;
  field: string;
  values: string[];
  observationIds: string[];
  correctionIds: string[];
}

function keyOf(item: Pick<SourceObservation | RepCorrection, "entityId" | "field">) {
  return `${item.entityId}\u0000${item.field}`;
}

export function resolveFacts(
  observations: SourceObservation[],
  corrections: RepCorrection[] = [],
): { facts: ResolvedFact[]; conflicts: FactConflict[] } {
  const keys = new Set([...observations.map(keyOf), ...corrections.map(keyOf)]);
  const facts: ResolvedFact[] = [];
  const conflicts: FactConflict[] = [];

  for (const key of keys) {
    const sourceCandidates = observations.filter((item) => keyOf(item) === key);
    const repCandidates = corrections.filter((item) => keyOf(item) === key);
    const newestCorrection = [...repCandidates].sort((a, b) =>
      b.correctedAt.localeCompare(a.correctedAt),
    )[0];
    const strongestObservation = [...sourceCandidates].sort(
      (a, b) => b.confidence - a.confidence || b.retrievedAt.localeCompare(a.retrievedAt),
    )[0];
    const selected = newestCorrection ?? strongestObservation;
    if (!selected) continue;

    facts.push({
      entityId: selected.entityId,
      field: selected.field,
      value: selected.value,
      sourceObservationId: newestCorrection ? undefined : strongestObservation?.id,
      correctionId: newestCorrection?.id,
      verifiedByRep: Boolean(newestCorrection),
      observedAt: newestCorrection?.correctedAt ?? strongestObservation.retrievedAt,
    });

    const values = Array.from(
      new Set([
        ...sourceCandidates.map((item) => item.value),
        ...repCandidates.map((item) => item.value),
      ]),
    );
    if (values.length > 1) {
      conflicts.push({
        entityId: selected.entityId,
        field: selected.field,
        values,
        observationIds: sourceCandidates.map((item) => item.id),
        correctionIds: repCandidates.map((item) => item.id),
      });
    }
  }

  return { facts, conflicts };
}
