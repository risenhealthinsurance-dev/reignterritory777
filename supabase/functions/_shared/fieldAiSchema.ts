import { z } from "zod";
import { FunctionError } from "./errors";

const confidenceSchema = z.enum(["low", "medium", "high"]);
const claimSchema = z.object({
  text: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
  confidence: confidenceSchema,
  sources: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().nullable(),
        retrievedAt: z.string(),
      }),
    )
    .optional(),
});

export const fieldAiResultSchema = z.object({
  status: z.enum(["complete", "refused"]),
  answer: z.string().min(1),
  facts: z.array(claimSchema),
  inferences: z.array(claimSchema),
  uncertainties: z.array(z.string()),
  confidence: confidenceSchema,
  suggestedActions: z.array(
    z.object({
      type: z.enum(["research", "follow_up", "profile_edit", "route_change"]),
      summary: z.string().min(1),
    }),
  ),
});

export type FieldAiResult = z.infer<typeof fieldAiResultSchema>;

export interface FieldAiEvidence {
  id: string;
  field: string;
  value: unknown;
  sourceName: string;
  sourceUrl: string | null;
  retrievedAt: string;
  confidence: number;
}

export const fieldAiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["complete", "refused"] },
    answer: { type: "string" },
    facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" } },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["text", "evidenceIds", "confidence"],
      },
    },
    inferences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" } },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["text", "evidenceIds", "confidence"],
      },
    },
    uncertainties: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    suggestedActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["research", "follow_up", "profile_edit", "route_change"],
          },
          summary: { type: "string" },
        },
        required: ["type", "summary"],
      },
    },
  },
  required: [
    "status",
    "answer",
    "facts",
    "inferences",
    "uncertainties",
    "confidence",
    "suggestedActions",
  ],
} as const;

export function buildOpenAIRequest({
  model,
  intent,
  repInput,
  contextLabel,
  evidence,
}: {
  model: string;
  intent: string;
  repInput: string | null;
  contextLabel: string;
  evidence: FieldAiEvidence[];
}) {
  return {
    model,
    store: false,
    input: [
      {
        role: "developer",
        content:
          "You are a B2B field representative copilot. Use only supplied evidence for factual claims. Label inference, preserve uncertainty, cite evidence IDs exactly, and say Not verified when support is absent. Suggested actions are drafts and must never claim they were sent, saved, or applied.",
      },
      {
        role: "user",
        content: JSON.stringify({ intent, repInput, contextLabel, evidence }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "field_ai_result",
        strict: true,
        schema: fieldAiJsonSchema,
      },
    },
  };
}

export function parseOpenAIResponse(response: unknown): FieldAiResult {
  const output = (response as { output?: Array<{ content?: Array<Record<string, unknown>> }> })
    ?.output;
  const content = output?.flatMap((item) => item.content ?? []) ?? [];
  if (content.some((item) => item.type === "refusal")) {
    return {
      status: "refused",
      answer: "The AI provider declined this request.",
      facts: [],
      inferences: [],
      uncertainties: ["No provider-generated answer is available."],
      confidence: "low",
      suggestedActions: [],
    };
  }
  const text = content.find((item) => item.type === "output_text")?.text;
  if (typeof text !== "string") {
    throw new FunctionError(502, "invalid_output", "OpenAI returned no structured output.");
  }
  try {
    return fieldAiResultSchema.parse(JSON.parse(text));
  } catch {
    throw new FunctionError(502, "invalid_output", "OpenAI returned invalid structured output.");
  }
}

export function validateEvidenceCitations(result: FieldAiResult, evidence: FieldAiEvidence[]) {
  const allowed = new Set(evidence.map((item) => item.id));
  for (const claim of [...result.facts, ...result.inferences]) {
    for (const evidenceId of claim.evidenceIds) {
      if (!allowed.has(evidenceId)) {
        throw new FunctionError(
          502,
          "unsupported_citation",
          `OpenAI cited unsupported evidence ${evidenceId}.`,
        );
      }
    }
  }
  return result;
}

export function mapOpenAIError(status: number, payload: unknown) {
  const providerCode = (payload as { error?: { code?: string } })?.error?.code;
  if (status === 429 && providerCode === "insufficient_quota") {
    return new FunctionError(429, "quota_exceeded", "OpenAI project quota is unavailable.");
  }
  if (status === 429) {
    return new FunctionError(429, "provider_rate_limited", "OpenAI rate limit reached.");
  }
  if (status >= 500) {
    return new FunctionError(503, "provider_unavailable", "OpenAI is temporarily unavailable.");
  }
  return new FunctionError(502, "provider_error", "OpenAI could not complete the request.");
}
