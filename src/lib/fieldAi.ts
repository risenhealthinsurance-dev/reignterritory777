import {
  fieldAiResultSchema,
  type FieldAiResult,
} from "../../supabase/functions/_shared/fieldAiSchema";

export type FieldAiIntent =
  | "brief"
  | "talking_points"
  | "objection"
  | "prior_interactions"
  | "visit_note";

export interface FieldAiRequest {
  scope: { type: "account"; accountId: string } | { type: "territory"; territoryId: string };
  intent: FieldAiIntent;
  repInput?: string;
  idempotencyKey: string;
}

export interface FieldAiClient {
  ask(request: FieldAiRequest): Promise<FieldAiResult>;
}

interface FunctionInvoker {
  functions: {
    invoke(name: string, options: { body: any }): Promise<{ data: unknown; error: any }>;
  };
}

export class FieldAiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FieldAiClientError";
  }
}

export function createFieldAiClient(client: FunctionInvoker): FieldAiClient {
  return {
    async ask(request) {
      const { data, error } = await client.functions.invoke("field-ai", { body: request });
      if (error) {
        let code = "field_ai_unavailable";
        try {
          const payload = await error.context?.json?.();
          code = payload?.error?.code ?? code;
        } catch {
          // Keep the stable generic code when a gateway body is unavailable.
        }
        throw new FieldAiClientError(code, code.replace(/_/g, " "));
      }
      const parsed = fieldAiResultSchema.safeParse(data);
      if (!parsed.success) {
        throw new FieldAiClientError("invalid_output", "Field AI returned an invalid response.");
      }
      return parsed.data;
    },
  };
}

export type { FieldAiResult };
