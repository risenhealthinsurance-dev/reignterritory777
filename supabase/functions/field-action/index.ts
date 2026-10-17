import { createClient } from "npm:@supabase/supabase-js@2";
import { createSupabaseActorLookup, requireActor } from "../_shared/auth.ts";
import { validateFieldAction } from "../_shared/fieldActionSchema.ts";
import { FunctionError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";

interface RequestBody {
  operation?: "replay";
  action?: unknown;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") return errorResponse(new FunctionError(405, "method_not_allowed", "POST is required."));
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const actor = await requireActor(request, createSupabaseActorLookup(client));
    const body = await readJson<RequestBody>(request);
    if (body.operation !== "replay") throw new FunctionError(422, "invalid_operation", "Only replay is supported.");
    let action;
    try {
      action = validateFieldAction(body.action);
    } catch (cause) {
      throw new FunctionError(422, "invalid_action", cause instanceof Error ? cause.message : "Invalid field action.");
    }

    const { data: business, error: businessError } = await client
      .from("businesses")
      .select("id")
      .eq("organization_id", actor.organizationId)
      .eq("id", action.accountId)
      .maybeSingle();
    if (businessError) throw new FunctionError(500, "business_lookup_failed", "Unable to verify the selected business.");
    if (!business) throw new FunctionError(404, "business_not_found", "The selected business was not found.");

    const { data: existing, error: existingError } = await client
      .from("sync_mutations")
      .select("id,status")
      .eq("organization_id", actor.organizationId)
      .eq("idempotency_key", action.id)
      .maybeSingle();
    if (existingError) throw new FunctionError(500, "mutation_lookup_failed", "Unable to check action idempotency.");
    if (existing) return jsonResponse({ action: { ...action, status: "completed" }, mutation: existing, replayed: true });

    const { data: mutation, error: mutationError } = await client
      .from("sync_mutations")
      .insert({
        organization_id: actor.organizationId,
        rep_profile_id: actor.repId,
        idempotency_key: action.id,
        entity_type: action.type,
        entity_id: action.accountId,
        payload: action.payload,
        status: "queued",
      })
      .select("id,status")
      .single();
    if (mutationError || !mutation) throw new FunctionError(500, "mutation_create_failed", "Unable to queue the approved action.");
    return jsonResponse({ action: { ...action, status: "completed" }, mutation, replayed: false });
  } catch (cause) {
    return errorResponse(cause);
  }
});
