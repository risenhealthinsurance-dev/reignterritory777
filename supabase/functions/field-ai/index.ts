import { createClient } from "npm:@supabase/supabase-js@2";
import { createSupabaseActorLookup, requireActor } from "../_shared/auth.ts";
import { FunctionError } from "../_shared/errors.ts";
import {
  buildOpenAIRequest,
  mapOpenAIError,
  parseOpenAIResponse,
  validateEvidenceCitations,
  type FieldAiEvidence,
} from "../_shared/fieldAiSchema.ts";
import { errorResponse, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";

interface RequestBody {
  scope?: { type: "account"; accountId: string } | { type: "territory"; territoryId: string };
  intent?: "brief" | "talking_points" | "objection" | "prior_interactions" | "visit_note";
  repInput?: string;
  idempotencyKey?: string;
}

function sourceInfo(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value as { name?: string } | null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST")
    return errorResponse(new FunctionError(405, "method_not_allowed", "POST is required."));
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const actor = await requireActor(request, createSupabaseActorLookup(client));
    const body = await readJson<RequestBody>(request);
    if (!body.scope || !body.intent || !body.idempotencyKey) {
      throw new FunctionError(
        422,
        "invalid_request",
        "scope, intent, and idempotencyKey are required.",
      );
    }
    const { data: replay } = await client
      .from("ai_runs")
      .select("output,status")
      .eq("organization_id", actor.organizationId)
      .eq("idempotency_key", body.idempotencyKey)
      .maybeSingle();
    if (replay?.status === "complete" || replay?.status === "refused") {
      return jsonResponse(replay.output);
    }

    let business: { id: string; display_name: string } | null = null;
    if (body.scope.type === "account") {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          body.scope.accountId,
        );
      let query = client.from("businesses").select("id,display_name");
      query = isUuid
        ? query.eq("id", body.scope.accountId)
        : query.eq("external_key", body.scope.accountId);
      const { data, error } = await query.maybeSingle();
      if (error || !data)
        throw new FunctionError(404, "business_not_found", "The selected business was not found.");
      business = data;
    }

    let evidenceQuery = client
      .from("source_observations")
      .select("id,field_name,field_value,source_url,retrieved_at,confidence,source_registry(name)")
      .eq("organization_id", actor.organizationId)
      .order("retrieved_at", { ascending: false })
      .limit(50);
    if (business) evidenceQuery = evidenceQuery.eq("entity_id", business.id);
    const { data: evidenceRows, error: evidenceError } = await evidenceQuery;
    if (evidenceError)
      throw new FunctionError(
        500,
        "evidence_lookup_failed",
        "Authorized evidence could not be loaded.",
      );
    const evidence: FieldAiEvidence[] = (evidenceRows ?? []).map((row: any) => ({
      id: row.id,
      field: row.field_name,
      value: row.field_value,
      sourceName: sourceInfo(row.source_registry)?.name ?? row.field_name,
      sourceUrl: row.source_url,
      retrievedAt: row.retrieved_at,
      confidence: Number(row.confidence),
    }));

    const { data: run, error: runError } = await client
      .from("ai_runs")
      .insert({
        organization_id: actor.organizationId,
        rep_profile_id: actor.repId,
        business_id: business?.id ?? null,
        intent: body.intent,
        idempotency_key: body.idempotencyKey,
        status: "running",
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-6-luna",
      })
      .select("id")
      .single();
    if (runError || !run)
      throw new FunctionError(
        500,
        "ai_run_create_failed",
        "The AI audit record could not be created.",
      );

    const startedAt = Date.now();
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY") ?? ""}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(
        buildOpenAIRequest({
          model: Deno.env.get("OPENAI_MODEL") ?? "gpt-6-luna",
          intent: body.intent,
          repInput: body.repInput ?? null,
          contextLabel: business?.display_name ?? body.scope.territoryId,
          evidence,
        }),
      ),
    });
    const providerPayload = await openAIResponse.json().catch(() => null);
    if (!openAIResponse.ok) throw mapOpenAIError(openAIResponse.status, providerPayload);
    const parsed = validateEvidenceCitations(parseOpenAIResponse(providerPayload), evidence);
    const evidenceById = new Map(evidence.map((item) => [item.id, item]));
    const hydrate = (claim: (typeof parsed.facts)[number]) => ({
      ...claim,
      sources: claim.evidenceIds
        .map((id) => evidenceById.get(id))
        .filter((item): item is FieldAiEvidence => Boolean(item))
        .map((item) => ({
          id: item.id,
          name: item.sourceName,
          url: item.sourceUrl,
          retrievedAt: item.retrievedAt,
        })),
    });
    const result = {
      ...parsed,
      facts: parsed.facts.map(hydrate),
      inferences: parsed.inferences.map(hydrate),
    };
    const finalStatus = parsed.status === "refused" ? "refused" : "complete";
    const { error: completionError } = await client
      .from("ai_runs")
      .update({
        status: finalStatus,
        output: result,
        latency_ms: Date.now() - startedAt,
      })
      .eq("id", run.id);
    if (completionError)
      throw new FunctionError(500, "ai_run_store_failed", "The AI result could not be audited.");
    const citationRows = [...result.facts, ...result.inferences].flatMap((claim, claimIndex) =>
      claim.evidenceIds.map((evidenceId) => ({
        organization_id: actor.organizationId,
        ai_run_id: run.id,
        source_observation_id: evidenceId,
        claim_path: `claims.${claimIndex}`,
      })),
    );
    if (citationRows.length) await client.from("ai_citations").insert(citationRows);
    if (result.suggestedActions.length) {
      await client.from("ai_suggested_actions").insert(
        result.suggestedActions.map((action) => ({
          organization_id: actor.organizationId,
          ai_run_id: run.id,
          action_type: action.type,
          payload: { summary: action.summary },
          status: "draft",
        })),
      );
    }
    return jsonResponse(result);
  } catch (cause) {
    return errorResponse(cause);
  }
});
