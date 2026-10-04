export interface GeoJsonFeature {
  type: "Feature";
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export function normalizeGeoJsonFeature(value: unknown, sourceId: string): GeoJsonFeature | null {
  const candidate = value as Partial<GeoJsonFeature> | null;
  if (!candidate || candidate.type !== "Feature" || !candidate.geometry) return null;
  if (!candidate.geometry.type || !Array.isArray(candidate.geometry.coordinates)) return null;
  return {
    type: "Feature",
    ...(candidate.id === undefined ? {} : { id: candidate.id }),
    geometry: candidate.geometry,
    properties: { ...(candidate.properties ?? {}), sourceId, selectable: true },
  };
}

export function buildZoningOverlay(features: Array<GeoJsonFeature | null>): GeoJsonFeatureCollection {
  return { type: "FeatureCollection", features: features.filter((feature): feature is GeoJsonFeature => Boolean(feature)) };
}
