import { accounts } from "../data/accounts";
import type { Account } from "../data/accounts";
import {
  REP_BRIEF_CONTRACT_VERSION,
  type RepAccountBrief,
  type RepBriefResponse,
} from "../contracts/repBrief";

const CACHE_KEY = `reign-territory:rep-brief:v${REP_BRIEF_CONTRACT_VERSION}`;

function accountToBrief(account: Account): RepAccountBrief {
  return {
    businessId: account.id,
    name: account.name,
    category: account.industry,
    address: account.address,
    zip: "34950",
    quadrant: "A1",
    coordinates: { latitude: account.lat, longitude: account.lng },
    phone: account.contact.phone,
    routeOrder: account.routeOrder,
    distanceMiles: account.routeOrder * 0.8,
    priorityScore: Math.max(55, 100 - account.routeOrder * 7),
    whyThisAccount: [account.notes],
    fitReasons: [account.tier, `${account.industry} buying center`],
    publicSignals: [
      { label: "Company tier", value: account.tier, source: "territory profile" },
      { label: "Last visit", value: `${account.lastVisitDaysAgo} days ago`, source: "field history" },
    ],
    confidence: "medium",
    freshness: "fixture · refreshed today",
    enrichmentStatus: "partial",
    suggestedOpener: account.notes,
    recommendedAction: account.done ? "Confirm next step" : "Start the visit",
    evidence: [{ label: "Revenue signal", value: `$${(account.revenue / 1_000_000).toFixed(1)}M ARR`, confidence: "medium" }],
  };
}

export const fixtureRepBrief: RepBriefResponse = {
  contractVersion: REP_BRIEF_CONTRACT_VERSION,
  generatedAt: new Date().toISOString(),
  territory: { zip: "34950", quadrant: "A1" },
  accounts: accounts.map(accountToBrief),
  coverage: { discovered: accounts.length, enriched: 0, remaining: accounts.length },
  warnings: [{ code: "fixture-data", message: "Using local territory intelligence until a live brief is available." }],
};

export function readCachedRepBrief(): RepBriefResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RepBriefResponse;
    return parsed.contractVersion === REP_BRIEF_CONTRACT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function cacheRepBrief(brief: RepBriefResponse) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(brief));
  } catch {
    // Cache is an enhancement; field execution must remain usable without storage.
  }
}

export async function fetchRepBrief(signal?: AbortSignal): Promise<RepBriefResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_OSINT_API_URL ?? ""}/api/rep-brief?zip=34950&quadrant=A1&rep=field-rep`,
    { signal },
  );
  if (!response.ok) throw new Error(`Rep brief unavailable (${response.status})`);
  const brief = (await response.json()) as RepBriefResponse;
  if (brief.contractVersion !== REP_BRIEF_CONTRACT_VERSION) throw new Error("Unsupported rep brief version");
  cacheRepBrief(brief);
  return brief;
}
