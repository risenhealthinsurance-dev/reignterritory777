import { FunctionError, classifySourceError } from "./errors.ts";
import type { BusinessLookup, ConnectorRecord, ProvenanceObservation } from "./types.ts";

export interface SourceConnector {
  id: string;
  lookup(input: BusinessLookup): Promise<ConnectorRecord[]>;
}

export interface SourceAttempt {
  sourceId: string;
  status: string;
  observationCount: number;
  message?: string;
}

async function jsonFrom(response: Response) {
  if (response.status === 429) {
    throw new FunctionError(
      429,
      "rate_limited",
      "Source rate limit reached.",
      response.headers.get("retry-after") ?? undefined,
    );
  }
  if (!response.ok)
    throw new FunctionError(503, "unavailable", `Source returned ${response.status}.`);
  try {
    return await response.json();
  } catch {
    throw new FunctionError(502, "malformed_source", "Source returned malformed JSON.");
  }
}

export async function runConnectors(
  connectors: SourceConnector[],
  input: BusinessLookup,
  retrievedAt: string,
): Promise<{ observations: ProvenanceObservation[]; attempts: SourceAttempt[] }> {
  const settled = await Promise.allSettled(connectors.map((connector) => connector.lookup(input)));
  const observations: ProvenanceObservation[] = [];
  const attempts: SourceAttempt[] = [];
  settled.forEach((result, index) => {
    const sourceId = connectors[index].id;
    if (result.status === "fulfilled") {
      observations.push(...result.value.map((record) => ({ ...record, sourceId, retrievedAt })));
      attempts.push({ sourceId, status: "success", observationCount: result.value.length });
      return;
    }
    attempts.push({
      sourceId,
      status: classifySourceError(result.reason),
      observationCount: 0,
      message: result.reason instanceof Error ? result.reason.message : "Source failed.",
    });
  });
  return { observations, attempts };
}

function hostname(website?: string) {
  if (!website) return null;
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function assertPublicWebsite(website: string) {
  let url: URL;
  try {
    url = new URL(website);
  } catch {
    throw new FunctionError(422, "policy_blocked", "Official website URL is invalid.");
  }
  const host = url.hostname.toLowerCase();
  const privateHost =
    host === "localhost" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (url.protocol !== "https:" || privateHost) {
    throw new FunctionError(422, "policy_blocked", "Official website must use public HTTPS.");
  }
  return url.toString();
}

function genericJsonConnector(
  id: string,
  fetcher: typeof fetch,
  urlFor: (input: BusinessLookup) => string | null,
  headers?: HeadersInit,
): SourceConnector {
  return {
    id,
    async lookup(input) {
      const url = urlFor(input);
      if (!url) return [];
      const payload = await jsonFrom(await fetcher(url, { headers }));
      return [
        {
          field: `${id}_record`,
          value: payload,
          sourceUrl: url,
          confidence: 0.6,
          rawPayload: payload,
        },
      ];
    },
  };
}

export function createConnectorCatalog(fetcher: typeof fetch): SourceConnector[] {
  return [
    {
      id: "official-website",
      async lookup(input) {
        if (!input.website) return [];
        const website = assertPublicWebsite(input.website);
        const response = await fetcher(website, {
          headers: { accept: "text/html", "user-agent": "ReignTerritoryFieldAI/1.0" },
        });
        if (response.status === 429)
          throw Object.assign(new Error("rate limited"), { code: "rate_limited" });
        if (!response.ok)
          throw Object.assign(new Error(`website returned ${response.status}`), {
            code: "unavailable",
          });
        const html = await response.text();
        const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
        return title
          ? [
              {
                field: "website_title",
                value: title,
                sourceUrl: website,
                confidence: 0.8,
                rawPayload: { title },
              },
            ]
          : [];
      },
    },
    genericJsonConnector("census", fetcher, (input) =>
      input.address
        ? `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(input.address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
        : null,
    ),
    genericJsonConnector(
      "osm",
      fetcher,
      (input) =>
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(`[out:json];nwr["name"="${input.name.replaceAll('"', '\\"')}"];out center 10;`)}`,
      { "user-agent": "ReignTerritoryFieldAI/1.0" },
    ),
    genericJsonConnector(
      "nppes",
      fetcher,
      (input) =>
        `https://npiregistry.cms.hhs.gov/api/?version=2.1&organization_name=${encodeURIComponent(input.name)}&limit=20`,
    ),
    genericJsonConnector(
      "gleif",
      fetcher,
      (input) =>
        `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(input.name)}&page[size]=10`,
    ),
    genericJsonConnector(
      "sec-edgar",
      fetcher,
      () => "https://www.sec.gov/files/company_tickers.json",
      { "user-agent": "Reign Territory contact@reignagentic.io" },
    ),
    genericJsonConnector("icann-rdap", fetcher, (input) => {
      const domain = hostname(input.website);
      return domain ? `https://rdap.org/domain/${encodeURIComponent(domain)}` : null;
    }),
    {
      id: "sam-gov",
      async lookup() {
        throw Object.assign(new Error("SAM.gov API key is not configured."), {
          code: "policy_blocked",
        });
      },
    },
  ];
}

export interface ArcGisRecord {
  sourceId: string;
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
  retrievedAt: string;
}

export function normalizePolygonGeometry(geometry: { type: string; coordinates: unknown }) {
  if (geometry.type === "MultiPolygon") return geometry;
  if (geometry.type === "Polygon") {
    return { type: "MultiPolygon", coordinates: [geometry.coordinates] };
  }
  throw new FunctionError(
    422,
    "unsupported_geometry",
    `Expected polygon geometry, got ${geometry.type}.`,
  );
}

export async function fetchArcGisLayer({
  baseUrl,
  layer,
  pageSize,
  fetcher,
  retrievedAt,
}: {
  baseUrl: string;
  layer: number;
  pageSize: number;
  fetcher: typeof fetch;
  retrievedAt: string;
}) {
  const records: ArcGisRecord[] = [];
  const issues: Array<{ sourceId: string; code: string; message: string }> = [];
  let offset = 0;
  let more = true;
  while (more) {
    const url = new URL(`${baseUrl.replace(/\/$/, "")}/${layer}/query`);
    url.searchParams.set("where", "1=1");
    url.searchParams.set("outFields", "*");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("outSR", "4326");
    url.searchParams.set("f", "geojson");
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(pageSize));
    const payload = (await jsonFrom(await fetcher(url.toString()))) as {
      features?: Array<{
        id?: string | number;
        properties?: Record<string, unknown>;
        geometry?: { type: string; coordinates: unknown } | null;
      }>;
      exceededTransferLimit?: boolean;
    };
    if (!Array.isArray(payload.features)) {
      throw new FunctionError(502, "malformed_source", "ArcGIS response is missing features.");
    }
    for (const feature of payload.features) {
      const sourceId = String(feature.id ?? feature.properties?.OBJECTID ?? "unknown");
      if (!feature.geometry?.type || feature.geometry.coordinates == null) {
        issues.push({
          sourceId,
          code: "missing_geometry",
          message: "Feature has no usable geometry.",
        });
        continue;
      }
      records.push({
        sourceId,
        properties: feature.properties ?? {},
        geometry: feature.geometry,
        retrievedAt,
      });
    }
    offset += payload.features.length;
    more = Boolean(payload.exceededTransferLimit) && payload.features.length > 0;
  }
  return { records, issues };
}
