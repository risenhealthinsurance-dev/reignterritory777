import { describe, expect, it } from "vitest";
import {
  buildOpenAIRequest,
  mapOpenAIError,
  parseOpenAIResponse,
  validateEvidenceCitations,
} from "../_shared/fieldAiSchema";

const evidence = [
  {
    id: "evidence-1",
    field: "last_visit",
    value: "Requested a compliance comparison",
    sourceName: "Representative visit note",
    sourceUrl: null,
    retrievedAt: "2026-10-04T12:00:00.000Z",
    confidence: 1,
  },
];

const validResult = {
  status: "complete",
  answer: "Lead with the requested compliance comparison.",
  facts: [
    {
      text: "The buyer requested a compliance comparison.",
      evidenceIds: ["evidence-1"],
      confidence: "high",
    },
  ],
  inferences: [],
  uncertainties: [],
  confidence: "high",
  suggestedActions: [],
};

describe("Field AI OpenAI boundary", () => {
  it("builds a stateless strict structured Responses API request", () => {
    const request = buildOpenAIRequest({
      model: "gpt-6-luna",
      intent: "brief",
      repInput: null,
      contextLabel: "Apex Medical",
      evidence,
    });

    expect(request).toMatchObject({
      model: "gpt-6-luna",
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "field_ai_result",
          strict: true,
        },
      },
    });
    expect(JSON.stringify(request.input)).toContain("evidence-1");
  });

  it("rejects a structured answer that cites evidence outside the authorized set", () => {
    expect(() =>
      validateEvidenceCitations(
        {
          ...validResult,
          facts: [{ ...validResult.facts[0], evidenceIds: ["foreign-evidence"] }],
        },
        evidence,
      ),
    ).toThrowError(/unsupported evidence/i);
  });

  it("parses valid output text and fails closed on malformed output", () => {
    expect(
      parseOpenAIResponse({
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: JSON.stringify(validResult) }],
          },
        ],
      }),
    ).toEqual(validResult);
    expect(() =>
      parseOpenAIResponse({
        output: [{ type: "message", content: [{ type: "output_text", text: "not-json" }] }],
      }),
    ).toThrowError(/invalid structured output/i);
  });

  it("maps a model refusal to a safe refused result", () => {
    expect(
      parseOpenAIResponse({
        output: [{ type: "message", content: [{ type: "refusal", refusal: "Cannot answer" }] }],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "refused",
        answer: "The AI provider declined this request.",
        facts: [],
      }),
    );
  });

  it("classifies quota and transient provider failures", () => {
    expect(mapOpenAIError(429, { error: { code: "insufficient_quota" } })).toMatchObject({
      status: 429,
      code: "quota_exceeded",
    });
    expect(mapOpenAIError(503, { error: { code: "server_error" } })).toMatchObject({
      status: 503,
      code: "provider_unavailable",
    });
  });
});
