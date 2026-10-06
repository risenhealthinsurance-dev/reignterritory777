import { createClient } from "npm:@supabase/supabase-js@2";
import { createSupabaseActorLookup, requireActor } from "../_shared/auth.ts";
import { FunctionError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { createConnectorCatalog, runConnectors } from "../_shared/sources.ts";

interface RequestBody {
  businessId?: string;
  idempotencyKey?: string;
}

const sourceMetadata: Record<string, { name: string; license: string; rate: string }> = {
  "official-website": {
    name: "Official business website",
    license: "Source-specific",
    rate: "Respect source terms and caching",
  },
  census: {
    name: "US Census",
    license: "US Government public data",
    rate: "Respect Census API limits",
  },
  osm: {
    name: "OpenStreetMap",
    license: "ODbL",
    rate: "Use compliant Overpass capacity",
  },
  nppes: {
    name: "NPPES",
    license: "US Government public data",
    rate: "Respect NPI Registry limits",
  },
  gleif: {
    name: "GLEIF",
    license: "GLEIF open data terms",
    rate: "Respect GLEIF limits",
  },
  "sec-edgar": {
    name: "SEC EDGAR",
    license: "US Government public data",
    rate: "Identify client and respect SEC fair access",
  },
  "icann-rdap": {
    name: "ICANN RDAP",
    license: "Registry-specific",
    rate: "Respect RDAP service limits",
  },
  "sam-gov": {
    name: "SAM.gov",
    license: "US Government public data",
    rate: "Requires configured authorized API access",
  },
};

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
    if (!body.businessId || !body.idempotencyKey) {
      throw new FunctionError(
        422,
        "invalid_request",
        "businessId and idempotencyKey are required.",
      );
    }
    const { data: existing } = await client
      .from("enrichment_jobs")
      .select("id,status")
      .eq("organization_id", actor.organizationId)
      .eq("idempotency_key", body.idempotencyKey)
      .maybeSingle();
    if (existing) return jsonResponse({ job: existing, replayed: true });

    const { data: business, error: businessError } = await client
      .from("businesses")
      .select("id,display_name,website,business_locations(formatted_address)")
      .eq("id", body.businessId)
      .single();
    if (businessError || !business)
      throw new FunctionError(404, "business_not_found", "Business was not found.");

    const { data: job, error: jobError } = await client
      .from("enrichment_jobs")
      .insert({
        organization_id: actor.organizationId,
        business_id: business.id,
        idempotency_key: body.idempotencyKey,
        status: "running",
        requested_by: actor.repId,
      })
      .select("id,status")
      .single();
    if (jobError || !job)
      throw new FunctionError(500, "job_create_failed", "Unable to create enrichment job.");

    const connectors = createConnectorCatalog(fetch);
    const { error: registryError } = await client.from("source_registry").upsert(
      connectors.map((connector) => ({
        id: connector.id,
        organization_id: actor.organizationId,
        name: sourceMetadata[connector.id].name,
        license_name: sourceMetadata[connector.id].license,
        rate_limit_notes: sourceMetadata[connector.id].rate,
      })),
      { onConflict: "organization_id,id" },
    );
    if (registryError)
      throw new FunctionError(500, "source_registry_failed", "Unable to register sources.");

    const location = Array.isArray(business.business_locations)
      ? business.business_locations[0]
      : business.business_locations;
    const retrievedAt = new Date().toISOString();
    const result = await runConnectors(
      connectors,
      {
        name: business.display_name,
        address: location?.formatted_address ?? undefined,
        website: business.website ?? undefined,
      },
      retrievedAt,
    );
    if (result.observations.length) {
      const { error } = await client.from("source_observations").insert(
        result.observations.map((observation) => ({
          organization_id: actor.organizationId,
          entity_type: "business",
          entity_id: business.id,
          field_name: observation.field,
          field_value: observation.value,
          source_id: observation.sourceId,
          source_url: observation.sourceUrl,
          source_record_id: observation.sourceRecordId,
          retrieved_at: observation.retrievedAt,
          raw_payload: observation.rawPayload,
          confidence: observation.confidence,
        })),
      );
      if (error)
        throw new FunctionError(
          500,
          "observation_store_failed",
          "Unable to store source observations.",
        );
    }
    const { error: attemptError } = await client.from("enrichment_attempts").insert(
      result.attempts.map((attempt) => ({
        organization_id: actor.organizationId,
        job_id: job.id,
        source_id: attempt.sourceId,
        attempt_number: 1,
        status: attempt.status,
        error_code: attempt.status === "success" ? null : attempt.status,
      })),
    );
    if (attemptError)
      throw new FunctionError(500, "attempt_store_failed", "Unable to store source attempts.");
    const finalStatus = result.attempts.every((attempt) => attempt.status === "success")
      ? "complete"
      : result.observations.length
        ? "partial"
        : "failed";
    const { error: completeError } = await client
      .from("enrichment_jobs")
      .update({ status: finalStatus, completed_at: new Date().toISOString() })
      .eq("id", job.id);
    if (completeError)
      throw new FunctionError(500, "job_complete_failed", "Unable to complete enrichment job.");
    return jsonResponse({ job: { id: job.id, status: finalStatus }, result, replayed: false });
  } catch (cause) {
    return errorResponse(cause);
  }
});
