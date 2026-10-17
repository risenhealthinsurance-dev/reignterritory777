import type { AgentAction } from "../contracts/fieldAgent";

interface FunctionInvoker {
  functions: {
    invoke(name: string, options: { body: Record<string, any> }): Promise<{ data: unknown; error: unknown }>;
  };
}

export interface FieldActionClient {
  replay(action: AgentAction): Promise<AgentAction>;
}

export function createFieldActionClient(client: FunctionInvoker): FieldActionClient {
  return {
    async replay(action) {
      const { data, error } = await client.functions.invoke("field-action", {
        body: { operation: "replay", action },
      });
      if (error) throw error instanceof Error ? error : new Error("Field action service unavailable.");
      const response = data as { action?: AgentAction } | null;
      if (!response?.action) throw new Error("Field action service returned an invalid response.");
      return response.action;
    },
  };
}
