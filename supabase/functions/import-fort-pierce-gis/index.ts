import { createClient } from "npm:@supabase/supabase-js@2";
import { createSupabaseActorLookup, requireActor } from "../_shared/auth.ts";
import { FunctionError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { fetchArcGisLayer, normalizePolygonGeometry } from "../_shared/sources.ts";
import { classifyZoning } from "../_shared/zoning.ts";

const BASE_URL =
  "https://services1.arcgis.com/oDRzuf2MGmdEHAbQ/ArcGIS/rest/services/DataMap_EnerGovMap/FeatureServer";

function textValue(properties: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = properties[name];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
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
    const retrievedAt = new Date().toISOString();
    const definitions = [
      { layer: 0, table: "address_points" },
      { layer: 1, table: "parcels" },
      { layer: 3, table: "zoning_districts" },
      { layer: 4, table: "future_land_use_areas" },
    ] as const;
    const summary: Record<string, { imported: number; issues: number }> = {};

    for (const definition of definitions) {
      const result = await fetchArcGisLayer({
        baseUrl: BASE_URL,
        layer: definition.layer,
        pageSize: 1000,
        fetcher: fetch,
        retrievedAt,
      });
      const rows = result.records.map((record) => {
        const common = {
          organization_id: actor.organizationId,
          source_id: record.sourceId,
          retrieved_at: record.retrievedAt,
          source_updated_at: textValue(record.properties, ["EditDate", "EDIT_DATE", "LASTUPDATE"]),
        };
        if (definition.table === "address_points") {
          return {
            ...common,
            full_address: textValue(record.properties, [
              "FULLADDR",
              "FULL_ADDRESS",
              "SITE_ADDR",
              "ADDRESS",
            ]),
            location: record.geometry,
          };
        }
        const geometry = normalizePolygonGeometry(record.geometry);
        if (definition.table === "parcels") {
          return {
            ...common,
            parcel_number: textValue(record.properties, ["PARCEL_ID", "PARCELNO", "PARCEL_NUMBER"]),
            site_address: textValue(record.properties, ["SITE_ADDR", "SITE_ADDRESS", "ADDRESS"]),
            acreage: record.properties.ACRES ?? record.properties.ACREAGE ?? null,
            geometry,
          };
        }
        if (definition.table === "zoning_districts") {
          const zoningCode = textValue(record.properties, ["ZONING", "ZONE_CODE", "ZONING_CODE"]);
          const description = textValue(record.properties, [
            "ZONING_DESC",
            "DESCRIPTION",
            "ZONE_DESC",
          ]);
          return {
            ...common,
            zoning_code: zoningCode,
            zoning_description: description,
            classification: classifyZoning([{ code: zoningCode, description }]),
            geometry,
          };
        }
        return {
          ...common,
          designation: textValue(record.properties, ["FLU", "FLU_DESC", "DESCRIPTION", "LAND_USE"]),
          geometry,
        };
      });
      if (rows.length) {
        const { error } = await client
          .from(definition.table)
          .upsert(rows, { onConflict: "organization_id,source_id" });
        if (error)
          throw new FunctionError(500, "gis_upsert_failed", `Unable to store ${definition.table}.`);
      }
      summary[definition.table] = { imported: rows.length, issues: result.issues.length };
    }
    return jsonResponse({ retrievedAt, summary });
  } catch (cause) {
    return errorResponse(cause);
  }
});
