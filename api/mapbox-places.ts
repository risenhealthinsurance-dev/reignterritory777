type VercelRequest = { method?: string; query?: Record<string, string | string[] | undefined> };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  const query = first(request.query?.q)?.trim() ?? "";
  if (!query || query.length > 256) return response.status(400).json({ error: "Query must be between 1 and 256 characters" });
  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) return response.status(503).json({ error: "Mapbox search is not configured" });
  // Search Box forward returns POIs by relevance; `types=poi` is a Geocoding
  // parameter and causes a 400 on some Search Box API token configurations.
  const params = new URLSearchParams({ q: query, access_token: token, limit: "10", show_closed_pois: "false" });
  for (const key of ["proximity", "open_now", "poi_category", "minimum_rating"]) {
    const value = first(request.query?.[key]);
    if (value) params.set(key, value);
  }
  try {
    const upstream = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`);
    let payload: { features?: Array<{ id?: string; text?: string; place_name?: string; geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> }> };
    let source = "searchbox";
    if (upstream.ok) {
      payload = await upstream.json();
    } else {
      // Some Mapbox public tokens have tiles/geocoding access before Search Box access.
      // Keep ordinary discovery useful while retaining Search Box for open_now searches.
      if (first(request.query?.open_now) === "true") return response.status(upstream.status).json({ error: "Mapbox open-hours search is not enabled for this token" });
      const fallbackParams = new URLSearchParams({ access_token: token, limit: "10", types: "poi" });
      const proximity = first(request.query?.proximity);
      if (proximity) fallbackParams.set("proximity", proximity);
      const fallback = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${fallbackParams.toString()}`);
      if (!fallback.ok) return response.status(upstream.status).json({ error: "Mapbox search request failed" });
      payload = await fallback.json();
      source = "geocoding";
    }
    const businesses = (payload.features ?? []).flatMap((feature, index) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") return [];
      const properties = feature.properties ?? {};
      const isOpen = typeof properties.open === "boolean" ? properties.open : null;
      const name = String(properties.name ?? properties.name_preferred ?? feature.text ?? properties.text ?? "Mapbox place");
      return [{
        id: `mapbox-${feature.id ?? index}`,
        externalId: feature.id,
        name,
        industry: "Technology" as const,
        tier: "SMB" as const,
        contact: { name: "Mapbox place", title: "Unverified", phone: "" },
        address: String(properties.full_address ?? properties.place_formatted ?? properties.address ?? feature.place_name ?? "Address from Mapbox"),
        lat: coordinates[1] as number,
        lng: coordinates[0] as number,
        revenue: 0,
        lastVisit: "",
        lastVisitDaysAgo: 0,
        activities: [],
        notes: `Live place discovered through Mapbox ${source}.`,
        routeOrder: index + 1,
        done: false,
        source: "mapbox" as const,
        isOpen,
      }];
    });
    return response.status(200).json({ businesses });
  } catch {
    return response.status(502).json({ error: "Unable to reach Mapbox" });
  }
}
