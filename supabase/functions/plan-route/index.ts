import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { FunctionError } from "../_shared/errors.ts";

export interface RoutePoint { lng: number; lat: number }

export function buildOsrmRequest(points: RoutePoint[]) {
  if (points.length < 2 || points.some((point) => !Number.isFinite(point.lng) || !Number.isFinite(point.lat))) {
    throw new FunctionError(422, "invalid_coordinates", "At least two valid coordinates are required.");
  }
  return `https://router.project-osrm.org/route/v1/driving/${points.map((point) => `${point.lng},${point.lat}`).join(";")}?overview=full&geometries=geojson&steps=false`;
}

export function parseOsrmRoute(payload: unknown) {
  const value = payload as { code?: string; routes?: Array<{ distance?: number; duration?: number; geometry?: unknown }> };
  const route = value?.routes?.[0];
  if (value?.code !== "Ok" || !route?.geometry || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new FunctionError(502, "route_unavailable", "A road-network route could not be verified.");
  }
  return { distanceMeters: route.distance, durationSeconds: route.duration, geometry: route.geometry };
}

if (typeof Deno !== "undefined") {
  Deno.serve(async (request) => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return errorResponse(new FunctionError(405, "method_not_allowed", "POST is required."));
    try {
      const body = await request.json() as { points?: RoutePoint[] };
      const response = await fetch(buildOsrmRequest(body.points ?? []));
      const payload = await response.json();
      return jsonResponse(parseOsrmRoute(payload));
    } catch (cause) {
      return errorResponse(cause);
    }
  });
}
