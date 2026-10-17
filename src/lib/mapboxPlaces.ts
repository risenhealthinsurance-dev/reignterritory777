import type { Account } from "../data/accounts";

export interface PlacesSearchOptions {
  query: string;
  proximity?: { lng: number; lat: number };
  openNow?: boolean;
}

export async function searchMapboxPlaces(options: PlacesSearchOptions, fetcher: typeof fetch = fetch): Promise<Account[]> {
  const params = new URLSearchParams({ q: options.query.trim(), limit: "25", types: "poi", show_closed_pois: "false" });
  if (options.openNow) params.set("open_now", "true");
  if (options.proximity) params.set("proximity", `${options.proximity.lng},${options.proximity.lat}`);
  const response = await fetcher(`/api/mapbox-places?${params.toString()}`);
  if (!response.ok) throw new Error(`Mapbox search failed (${response.status})`);
  const payload = await response.json() as { businesses?: Account[] };
  return payload.businesses ?? [];
}
