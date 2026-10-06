import { FunctionError } from "./errors.ts";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function errorResponse(cause: unknown) {
  const error =
    cause instanceof FunctionError
      ? cause
      : new FunctionError(500, "internal_error", "The request could not be completed.");
  return jsonResponse({ error: { code: error.code, message: error.message } }, error.status);
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new FunctionError(400, "invalid_json", "A valid JSON request body is required.");
  }
}
