import { describe, expect, it } from "vitest";
import { resolveFacts, type RepCorrection, type SourceObservation } from "./evidence";

const baseObservation: SourceObservation = {
  id: "obs-1",
  entityId: "business-1",
  field: "phone",
  value: "+1-772-555-0100",
  sourceId: "official-website",
  sourceUrl: "https://example.test/contact",
  retrievedAt: "2026-10-04T12:00:00.000Z",
  confidence: 0.9,
};

describe("resolveFacts", () => {
  it("selects the highest-confidence sourced value and preserves retrieval metadata", () => {
    const result = resolveFacts([
      baseObservation,
      {
        ...baseObservation,
        id: "obs-2",
        value: "+1-772-555-0199",
        sourceId: "directory",
        retrievedAt: "2026-10-03T12:00:00.000Z",
        confidence: 0.5,
      },
    ]);

    expect(result.facts).toEqual([
      expect.objectContaining({
        field: "phone",
        value: "+1-772-555-0100",
        sourceObservationId: "obs-1",
        verifiedByRep: false,
      }),
    ]);
    expect(result.conflicts).toEqual([
      expect.objectContaining({
        field: "phone",
        values: ["+1-772-555-0100", "+1-772-555-0199"],
        observationIds: ["obs-1", "obs-2"],
      }),
    ]);
  });

  it("uses a representative correction without deleting conflicting source history", () => {
    const correction: RepCorrection = {
      id: "correction-1",
      entityId: "business-1",
      field: "phone",
      value: "+1-772-555-0177",
      correctedAt: "2026-10-04T13:00:00.000Z",
      repId: "rep-1",
      reason: "Confirmed during visit",
    };

    const result = resolveFacts([baseObservation], [correction]);

    expect(result.facts).toEqual([
      expect.objectContaining({
        value: "+1-772-555-0177",
        correctionId: "correction-1",
        verifiedByRep: true,
      }),
    ]);
    expect(result.conflicts[0]).toEqual(
      expect.objectContaining({
        values: ["+1-772-555-0100", "+1-772-555-0177"],
        observationIds: ["obs-1"],
        correctionIds: ["correction-1"],
      }),
    );
  });

  it("does not combine the same field across different businesses", () => {
    const result = resolveFacts([
      baseObservation,
      { ...baseObservation, id: "obs-2", entityId: "business-2", value: "different" },
    ]);

    expect(result.facts).toHaveLength(2);
    expect(result.conflicts).toEqual([]);
  });
});
