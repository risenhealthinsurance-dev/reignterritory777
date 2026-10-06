import { REP_BRIEF_CONTRACT_VERSION, type RepBriefResponse } from "../contracts/repBrief";
const CACHE_KEY = "reign-territory:rep-brief:v1";

export function normalizeRepBrief(value: unknown): RepBriefResponse {
  const input = (value && typeof value === "object" ? value : {}) as Partial<RepBriefResponse>;
  return { contractVersion: REP_BRIEF_CONTRACT_VERSION, generatedAt: input.generatedAt || new Date().toISOString(), expiresAt: input.expiresAt, territory: input.territory || { zip: "34950" }, accounts: Array.isArray(input.accounts) ? input.accounts : [], coverage: input.coverage || { discovered: 0, enriched: 0 }, warnings: Array.isArray(input.warnings) ? input.warnings : [] };
}
export function cacheRepBrief(value: RepBriefResponse) { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); }
export function readCachedRepBrief(): RepBriefResponse | null { try { const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return value?.contractVersion === REP_BRIEF_CONTRACT_VERSION ? normalizeRepBrief(value) : null; } catch { return null; } }
export async function fetchRepBrief(url = "/api/rep-brief"): Promise<RepBriefResponse> {
  const response = await fetch(`${url}?zip=34950&quadrant=A1&rep=field-rep`);
  if (!response.ok) throw new Error(`Rep brief unavailable (${response.status})`);
  const result = normalizeRepBrief(await response.json()); cacheRepBrief(result); return result;
}
