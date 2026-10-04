import type {
  QuadrantStatus,
  StopBadge,
  FindingStatus,
  OpportunityLabel,
  ConfidenceLevel,
  Provenance,
} from "../types";

// ── Grid geometry ─────────────────────────────────────────────────────────────
export const GRID = { W: -80.37, E: -80.31, N: 27.47, S: 27.41 };
const COL_W = (GRID.E - GRID.W) / 4; // 0.03° per column
const ROW_H = (GRID.N - GRID.S) / 6; // 0.01° per row
const COLS = ["A", "B", "C", "D"] as const;

function snakeOrder(colIdx: number, row: number): number {
  const base = (row - 1) * 4;
  return row % 2 === 1 ? base + colIdx + 1 : base + (3 - colIdx) + 1;
}

export interface Quadrant {
  id: string;
  col: string;
  row: number;
  snakeOrder: number;
  status: QuadrantStatus;
  counts: { newDoor: number; reloop: number; followUp: number; retention: number };
}

export const QUADRANTS: Quadrant[] = [];
for (let r = 1; r <= 6; r++) {
  for (let c = 0; c < 4; c++) {
    const id = `${COLS[c]}${r}`;
    QUADRANTS.push({
      id,
      col: COLS[c],
      row: r,
      snakeOrder: snakeOrder(c, r),
      status: id === "A1" ? "active" : "available",
      counts:
        id === "A1"
          ? { newDoor: 4, reloop: 1, followUp: 2, retention: 1 }
          : {
              newDoor: (r + c) % 4,
              reloop: (r + c) % 2,
              followUp: (r * (c + 1)) % 3,
              retention: (r + c + 1) % 2,
            },
    });
  }
}

// ── GeoJSON helpers ───────────────────────────────────────────────────────────
export function quadrantGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: QUADRANTS.map((q) => {
      const colIdx = COLS.indexOf(q.col as (typeof COLS)[number]);
      const west = GRID.W + colIdx * COL_W;
      const east = west + COL_W;
      const north = GRID.N - (q.row - 1) * ROW_H;
      const south = north - ROW_H;
      return {
        type: "Feature" as const,
        properties: {
          id: q.id,
          status: q.status,
          label: q.id,
          order: q.snakeOrder,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [west, north],
              [east, north],
              [east, south],
              [west, south],
              [west, north],
            ],
          ],
        },
      };
    }),
  };
}

export function boundaryGeoJSON() {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [GRID.W, GRID.N],
          [GRID.E, GRID.N],
          [GRID.E, GRID.S],
          [GRID.W, GRID.S],
          [GRID.W, GRID.N],
        ],
      ],
    },
  };
}

export function quadrantLabelGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: QUADRANTS.map((q) => {
      const colIdx = COLS.indexOf(q.col as (typeof COLS)[number]);
      const lng = GRID.W + (colIdx + 0.5) * COL_W;
      const lat = GRID.N - (q.row - 0.5) * ROW_H;
      return {
        type: "Feature" as const,
        properties: { label: q.id, status: q.status },
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      };
    }),
  };
}

// ── A1 quadrant stops ─────────────────────────────────────────────────────────
export interface QuadrantStop {
  id: string;
  accountId?: string;
  name: string;
  type: StopBadge;
  address: string;
  lat: number;
  lng: number;
  reason: string;
  eta: string;
  distance: string;
}

export const A1_STOPS: QuadrantStop[] = [
  {
    id: "qs-1",
    accountId: "meridian",
    name: "Meridian Medical Devices",
    type: "follow_up",
    address: "100 N US Highway 1, Fort Pierce",
    lat: 27.4488,
    lng: -80.3256,
    reason: "Follow-up due today — Sandra confirmed CFO review by Oct 10",
    eta: "9:15 AM",
    distance: "0.8 mi",
  },
  {
    id: "qs-2",
    accountId: "pacific",
    name: "Pacific Rim Logistics",
    type: "follow_up",
    address: "500 Orange Ave, Fort Pierce",
    lat: 27.4471,
    lng: -80.3298,
    reason: "Demo prep — send materials before Oct 7 deadline",
    eta: "10:05 AM",
    distance: "1.2 mi",
  },
  {
    id: "qs-3",
    accountId: "westside",
    name: "Westside Distribution Co",
    type: "reloop",
    address: "130 S Indian River Dr, Fort Pierce",
    lat: 27.4474,
    lng: -80.3227,
    reason: "Failed Oct 3 — Tommy out; office is open Fri mornings",
    eta: "10:52 AM",
    distance: "2.1 mi",
  },
  {
    id: "qs-4",
    accountId: "solano",
    name: "Solano Healthcare Partners",
    type: "retention",
    address: "2215 Okeechobee Rd, Fort Pierce",
    lat: 27.4321,
    lng: -80.3478,
    reason: "Retention — 23 days since visit; budget refreshed Oct 1",
    eta: "11:30 AM",
    distance: "1.7 mi",
  },
  {
    id: "qs-5",
    accountId: "apex",
    name: "Apex Manufacturing Group",
    type: "new_door",
    address: "800 Virginia Ave, Fort Pierce",
    lat: 27.4269,
    lng: -80.3311,
    reason: "High-value in-quadrant prospect; board window closes Oct 14",
    eta: "12:10 PM",
    distance: "1.4 mi",
  },
  {
    id: "qs-6",
    accountId: "bravo",
    name: "Bravo Industrial Supply",
    type: "new_door",
    address: "2400 Rhode Island Ave, Fort Pierce",
    lat: 27.4428,
    lng: -80.3509,
    reason: "Dormant 49 days — competitor risk; strong re-engagement hook",
    eta: "12:55 PM",
    distance: "0.9 mi",
  },
  {
    id: "qs-7",
    name: "Sunset Supply Solutions",
    type: "new_door",
    address: "600 Atlantic Ave, Fort Pierce",
    lat: 27.4374,
    lng: -80.3265,
    reason: "Cold prospect — logistics spend matches ICP; referred by partner",
    eta: "1:30 PM",
    distance: "1.1 mi",
  },
  {
    id: "qs-8",
    name: "Beverly Hills Wholesale",
    type: "new_door",
    address: "101 Melody Ln, Fort Pierce",
    lat: 27.451,
    lng: -80.3243,
    reason: "New prospect — referred by Tommy Park; similar operator profile",
    eta: "2:05 PM",
    distance: "0.6 mi",
  },
];

// ── Badge config ──────────────────────────────────────────────────────────────
export const BADGE_CONFIG: Record<
  StopBadge,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  follow_up: {
    label: "FOLLOW-UP",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.12)",
  },
  reloop: { label: "RELOOP", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  retention: {
    label: "RETENTION",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
  new_door: {
    label: "NEW DOOR",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
};

// ── Enrichment mock data (Apex Manufacturing Group) ───────────────────────────
export interface AuditFinding {
  status: FindingStatus;
  finding: string;
  recommendation: string;
  evidence: string;
  source: string;
  provenance: Provenance;
  confidence: ConfidenceLevel;
}
export interface AuditSection {
  title: string;
  icon: string;
  findings: AuditFinding[];
}
export interface SupplyOpportunity {
  vendor: string;
  icon: string;
  category: string;
  label: OpportunityLabel;
  detail: string;
  source: string;
  provenance: Provenance;
  confidence: ConfidenceLevel;
}
export interface ProfileEdit {
  field: string;
  current: string;
  proposed: string;
  evidence: string;
  confidence: ConfidenceLevel;
}

export const FINDING_CONFIG: Record<
  FindingStatus,
  {
    label: string;
    color: string;
    dot: string;
  }
> = {
  strong: { label: "Strong", color: "#10b981", dot: "#10b981" },
  partial: { label: "Partial", color: "#f59e0b", dot: "#f59e0b" },
  missing: { label: "Missing", color: "#ef4444", dot: "#ef4444" },
  unknown: { label: "Unknown", color: "#6b7490", dot: "#4b5563" },
};

export const OPP_CONFIG: Record<
  OpportunityLabel,
  {
    label: string;
    color: string;
  }
> = {
  observed: { label: "Observed", color: "#10b981" },
  publicly_supported: { label: "Publicly supported", color: "#3b82f6" },
  likely: { label: "Likely", color: "#f59e0b" },
  needs_confirmation: { label: "Needs confirmation", color: "#6b7490" },
};

export const APEX_AUDIT: AuditSection[] = [
  {
    title: "Website",
    icon: "🌐",
    findings: [
      {
        status: "strong",
        finding: "Website is live and indexed",
        recommendation: "Good — no action needed",
        evidence: "apexmfg.com returned HTTP 200; confirmed in Google index",
        source: "apexmfg.com · Google Search Console · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "partial",
        finding: "Contact page offers email only — no form or live chat",
        recommendation: "Add a contact form to capture inbound leads without rep intervention",
        evidence:
          "Inspected apexmfg.com/contact — single mailto link, no form element found in page source",
        source: "apexmfg.com/contact · Rep inspection Sep 29, 2026",
        provenance: "rep_observation",
        confidence: "high",
      },
      {
        status: "partial",
        finding: "About / Team page shows headshots and bios dated 2021",
        recommendation:
          "Update leadership bios before board pitch — stale pages undermine credibility",
        evidence:
          "Page timestamps and photo metadata indicate 2021; LinkedIn profiles for listed staff differ in role and title",
        source: "apexmfg.com/about · LinkedIn · Rep note Sep 29, 2026",
        provenance: "public",
        confidence: "medium",
      },
    ],
  },
  {
    title: "Google Business Profile",
    icon: "📍",
    findings: [
      {
        status: "strong",
        finding: "GBP claimed and owner-verified",
        recommendation: "Good standing — maintain monthly posting cadence",
        evidence: "Verified checkmark visible on Maps listing; ownership confirmed Mar 2024",
        source: "maps.google.com · verified Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "partial",
        finding: "No GBP posts in 90+ days",
        recommendation: "Post 1–2 times per month to maintain local rank",
        evidence: "Most recent post visible on listing dated Jul 2026; prior post Jun 2026",
        source: "maps.google.com/Apex Manufacturing Group · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "partial",
        finding: "4.1 ★ · 38 reviews · 3 unanswered complaints",
        recommendation: "Respond to unanswered negative reviews before board meeting",
        evidence: "Public GBP listing shows 3 1-star reviews with no owner response",
        source: "maps.google.com/Apex Manufacturing Group · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
    ],
  },
  {
    title: "Social Presence",
    icon: "📱",
    findings: [
      {
        status: "strong",
        finding: "LinkedIn company page — 412 followers",
        recommendation: "Good — consistent with enterprise tier; keep posting",
        evidence: "Active page with recent employee updates",
        source: "linkedin.com/company/apex-manufacturing-group · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "unknown",
        finding: "Instagram / Facebook: not found in sources checked",
        recommendation:
          "Not required for manufacturing B2B — low priority; confirm with Robert if relevant",
        evidence:
          "Search of Instagram and Facebook under known brand names and address returned no results. Absence is not confirmed — accounts may exist under an alternate name.",
        source: "Instagram · Facebook search · Oct 2026",
        provenance: "needs_confirmation",
        confidence: "low",
      },
    ],
  },
  {
    title: "Local Search",
    icon: "🔍",
    findings: [
      {
        status: "strong",
        finding: 'Ranks #2 in local pack for "manufacturing supplies West Hollywood"',
        recommendation: "Protect ranking with consistent GBP activity",
        evidence: "Confirmed in Google local pack — position 2 of 3",
        source: "Google SERP · West Hollywood query · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "partial",
        finding: 'Not in top 10 for "industrial supplier Beverly Hills"',
        recommendation: 'Add "industrial supplier" as GBP category to improve coverage',
        evidence:
          "Manual SERP check — competitors Grainger and Fastenal appear above; Apex not visible in first page",
        source: "Google SERP · Beverly Hills query · Oct 2026",
        provenance: "public",
        confidence: "medium",
      },
    ],
  },
  {
    title: "Conversion Readiness",
    icon: "⚡",
    findings: [
      {
        status: "strong",
        finding: "Phone number above fold on homepage (mobile)",
        recommendation: "Good — no change needed",
        evidence: "Confirmed visible on mobile viewport during rep inspection",
        source: "apexmfg.com · Rep inspection Sep 29, 2026",
        provenance: "rep_observation",
        confidence: "high",
      },
      {
        status: "missing",
        finding: "No RFQ / quote request flow on site",
        recommendation: "Add RFQ form — high-intent buyers bounce without a structured path",
        evidence: "All product pages reviewed — only phone CTA present; no form, no quote builder",
        source: "apexmfg.com product pages · Rep inspection Sep 29, 2026",
        provenance: "rep_observation",
        confidence: "high",
      },
      {
        status: "unknown",
        finding: "Online ordering capability: unknown",
        recommendation:
          "Confirm with Robert Garza during visit — may unlock supply automation opportunity",
        evidence:
          'No e-commerce or order portal found in public pages. Robert Garza mentioned an "online system" in Sep 25 call but did not confirm details.',
        source: "apexmfg.com · CRM call note Sep 25, 2026",
        provenance: "crm",
        confidence: "low",
      },
    ],
  },
];

export const APEX_SUPPLY_OPPS: SupplyOpportunity[] = [
  {
    vendor: "Amazon Business",
    icon: "📦",
    category: "MRO / office supplies",
    label: "likely",
    detail:
      "Manufacturing accounts at this revenue tier typically source $8K–15K/yr through Amazon Business. No Amazon Business storefront found in sources checked — enrollment not yet confirmed.",
    source: "ICP benchmark · Amazon Business public registry · Oct 2026",
    provenance: "public",
    confidence: "medium",
  },
  {
    vendor: "Office Depot Business",
    icon: "🖊",
    category: "Office & facility supplies",
    label: "observed",
    detail:
      "Office Depot boxes visible in delivery bay during Sep 29 visit. Active account is likely — current program tier and pricing not confirmed.",
    source: "Rep observation · Sep 29, 2026",
    provenance: "rep_observation",
    confidence: "high",
  },
  {
    vendor: "Mighty B2B",
    icon: "🏭",
    category: "Industrial & MRO marketplace",
    label: "publicly_supported",
    detail:
      "Apex is listed as a registered buyer on Mighty B2B marketplace (public buyer profile). Purchase frequency and category spend not visible.",
    source: "mighty.com public buyer directory · Oct 2026",
    provenance: "public",
    confidence: "high",
  },
  {
    vendor: "Fleet & fuel discount",
    icon: "⛽",
    category: "Fleet management",
    label: "needs_confirmation",
    detail:
      "3-vehicle fleet observed in lot during visit. Eligibility for WEX or Comdata discount depends on current provider — needs confirmation before any outreach.",
    source: "Rep observation Sep 29, 2026 · Current provider: unknown",
    provenance: "needs_confirmation",
    confidence: "low",
  },
];

export const APEX_PROFILE_EDITS: ProfileEdit[] = [
  {
    field: "Business category",
    current: "Manufacturing",
    proposed: "Industrial Manufacturing & Distribution",
    evidence:
      "Product line includes distribution services per website and Sep 29 walkthrough notes",
    confidence: "high",
  },
  {
    field: "Business hours",
    current: "(not set)",
    proposed: "Mon – Fri · 7:00 AM – 5:30 PM",
    evidence: "Observed operational hours during three visits; Robert confirmed in call Sep 25",
    confidence: "high",
  },
  {
    field: "Primary website URL",
    current: "apex-mfg-la.com (parked)",
    proposed: "apexmfg.com",
    evidence:
      "Parked domain redirects; active site is apexmfg.com per Google cache and rep observation",
    confidence: "high",
  },
];

// ── Sales Brief type ──────────────────────────────────────────────────────────
export interface SalesBrief {
  summary: string;
  opportunityScore: number;
  talkingPoints: string[];
  digitalGaps: string[];
  likelyNeeds: string[];
  recommendedAction: string;
}

// ── Apex Sales Brief ──────────────────────────────────────────────────────────
export const APEX_SALES_BRIEF: SalesBrief = {
  summary:
    "Apex Manufacturing Group is a high-priority Enterprise account with strong board-window urgency. Digital presence is solid but conversion paths are broken. Supply enrollment gaps represent $12K–18K in incremental annual revenue.",
  opportunityScore: 82,
  talkingPoints: [
    "RFQ form gap: buyers bounce without it — competitor Grainger has one; position as a compliance differentiator",
    "GBP has 3 unanswered negative reviews — offer to co-author a response with Robert before the Oct 14 board meeting",
    "About page is 3 years stale — update before the pitch to control the digital first impression",
  ],
  digitalGaps: [
    "No RFQ / quote request flow on website",
    "GBP posting lapse (90+ days) risks local rank drop",
    "3 unanswered negative reviews visible to competitors",
    "Parked domain apex-mfg-la.com creates confusion",
  ],
  likelyNeeds: [
    "Amazon Business enrollment ($8K–15K/yr MRO)",
    "Office Depot Business program tier upgrade",
    "Mighty B2B buyer profile optimization",
    "Fleet fuel discount confirmation (WEX / Comdata)",
  ],
  recommendedAction:
    "Lead with the compliance angle and the board-meeting timeline. Offer to co-resolve GBP reviews as a trust-building gesture before pitching the supply consolidation play.",
};

// ── Solano Healthcare Partners audit data ─────────────────────────────────────
export const SOLANO_AUDIT: AuditSection[] = [
  {
    title: "Website",
    icon: "🌐",
    findings: [
      {
        status: "partial",
        finding: "Patient portal link returns 404",
        recommendation: "Fix before next referral cycle — broken links erode trust and harm SEO",
        evidence:
          "portal.solanohealth.com returned HTTP 404 during inspection; landing page not cached",
        source: "portal.solanohealth.com · Rep inspection Oct 3, 2026",
        provenance: "rep_observation",
        confidence: "high",
      },
      {
        status: "strong",
        finding: "HIPAA compliance badge displayed and current",
        recommendation: "Good — track annual cert renewal date",
        evidence:
          "TrustArc seal visible in footer; badge links to valid certificate expiring Dec 2026",
        source: "solanohealth.com footer · TrustArc public cert · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "unknown",
        finding: "Service pricing and insurance info: not found in sources checked",
        recommendation:
          "Adding an accepted-insurance page can reduce admin call volume — confirm with Maria if feasible",
        evidence:
          'No pricing or insurance page found on solanohealth.com. Competitors appear above for "Beverly Hills healthcare pricing" — whether Solano intends to publish this is unconfirmed.',
        source: "solanohealth.com · Google SERP · Oct 2026",
        provenance: "needs_confirmation",
        confidence: "medium",
      },
    ],
  },
  {
    title: "Google Business Profile",
    icon: "📍",
    findings: [
      {
        status: "strong",
        finding: "GBP claimed, verified, and photos updated Aug 2026",
        recommendation: "Maintain monthly photo cadence to support local ranking",
        evidence:
          "Owner-verified checkmark; 14 photos visible on listing; most recent dated Aug 2026",
        source: "maps.google.com/Solano Healthcare Partners · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "partial",
        finding: "3.8 ★ · 67 reviews · 12 with no owner response",
        recommendation:
          "Respond to all within 72h — prioritize 2-star reviews which mention wait times",
        evidence:
          "Public listing shows 12 reviews with no response; 4 are 2-star with specific complaints",
        source: "maps.google.com/Solano Healthcare Partners · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "missing",
        finding: "GBP booking button not enabled",
        recommendation:
          "Enabling GBP booking reduces inbound call volume; competitors in this segment have it active",
        evidence:
          'No "Book" or "Schedule" CTA on GBP listing; booking.solanohealth.com exists and is functional',
        source: "maps.google.com · solanohealth.com/booking · Oct 2026",
        provenance: "public",
        confidence: "medium",
      },
    ],
  },
  {
    title: "Social Presence",
    icon: "📱",
    findings: [
      {
        status: "partial",
        finding: "LinkedIn page active — last post Mar 2026",
        recommendation:
          "Monthly posts reinforce B2B credibility; referral partners and insurers check LinkedIn",
        evidence: "Page has 88 followers; most recent post Mar 2026",
        source: "linkedin.com/company/solano-healthcare-partners · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "unknown",
        finding: "Healthgrades and Zocdoc: not found in sources checked",
        recommendation:
          "Confirm with Maria whether directory listings are part of their marketing plan — if not listed, enrollment could increase referral volume",
        evidence:
          'Searches on Healthgrades and Zocdoc under "Solano Healthcare Partners" and Beverly Hills address returned no results. Could be listed under a different entity name — needs confirmation.',
        source: "healthgrades.com · zocdoc.com search · Oct 2026",
        provenance: "needs_confirmation",
        confidence: "low",
      },
    ],
  },
  {
    title: "Local Search",
    icon: "🔍",
    findings: [
      {
        status: "partial",
        finding: 'Ranks #6 in local pack for "healthcare partners Beverly Hills"',
        recommendation:
          "GBP optimization and responding to reviews can improve ranking within 60 days",
        evidence: "Position 6 in local pack — below Cedars-Sinai affiliate and three competitors",
        source: "Google SERP · Beverly Hills query · Oct 2026",
        provenance: "public",
        confidence: "medium",
      },
      {
        status: "unknown",
        finding: '"Medical supply procurement Beverly Hills": not found in sources checked',
        recommendation:
          "If supply procurement is a service Solano offers, adding it to the website description could capture this search term — confirm with Maria",
        evidence:
          "Manual SERP check returned no results for Solano on this query. Whether they intend to target this term is unconfirmed.",
        source: "Google SERP · Oct 2026",
        provenance: "needs_confirmation",
        confidence: "low",
      },
    ],
  },
  {
    title: "Conversion Readiness",
    icon: "⚡",
    findings: [
      {
        status: "strong",
        finding: "Contact form functional with auto-response",
        recommendation: "Good — monitor response time SLA",
        evidence: "Test submission sent Oct 3; auto-reply received within 2 minutes",
        source: "solanohealth.com/contact · Rep test Oct 3, 2026",
        provenance: "rep_observation",
        confidence: "high",
      },
      {
        status: "partial",
        finding: "Mobile site load time 4.8s on 4G",
        recommendation:
          "Image optimization can reduce load time by 40–60% — bounce rate and SEO both improve",
        evidence:
          "PageSpeed Insights score: 52/100 on mobile; largest contentful paint is an uncompressed hero image",
        source: "PageSpeed Insights · solanohealth.com · Oct 2026",
        provenance: "public",
        confidence: "high",
      },
      {
        status: "unknown",
        finding: "EHR / patient management platform: unknown",
        recommendation:
          "Confirm EHR vendor with Maria during visit — may open a supply automation or integration opportunity",
        evidence:
          'No EHR vendor mentioned on website or in public sources. Maria mentioned "our system" in Sep 28 call but did not name the platform.',
        source: "CRM call note · Maria Trevino Sep 28, 2026",
        provenance: "crm",
        confidence: "low",
      },
    ],
  },
];

export const SOLANO_SUPPLY_OPPS: SupplyOpportunity[] = [
  {
    vendor: "Amazon Business",
    icon: "📦",
    category: "Medical & office supplies",
    label: "likely",
    detail:
      "Healthcare accounts at this revenue tier typically source $15K–25K/yr through Amazon Business. No Amazon Business account found in sources checked — enrollment not confirmed.",
    source: "ICP benchmark · Amazon Business public registry · Oct 2026",
    provenance: "needs_confirmation",
    confidence: "medium",
  },
  {
    vendor: "McKesson / Medline",
    icon: "🏥",
    category: "Medical consumables",
    label: "needs_confirmation",
    detail:
      "Likely sources medical consumables from a distributor — common for this segment. Current vendor is unknown; confirm with Maria during visit before any outreach.",
    source: "CRM account profile · Current vendor: unknown",
    provenance: "needs_confirmation",
    confidence: "low",
  },
  {
    vendor: "Office Depot Business",
    icon: "🖊",
    category: "Office & break room",
    label: "observed",
    detail:
      "Maria confirmed an active Office Depot account in the Sep 28 call. Current program tier is unconfirmed — opportunity to review pricing and upgrade if eligible.",
    source: "CRM call note · Maria Trevino Sep 28, 2026",
    provenance: "crm",
    confidence: "high",
  },
  {
    vendor: "Fleet & facility discount",
    icon: "🔧",
    category: "Facility maintenance",
    label: "needs_confirmation",
    detail:
      "Solano manages two locations. Facility maintenance spend is estimated — not confirmed. Current provider is unknown; confirm before discussing any discount program.",
    source: "CRM account profile · Two-location flag · Oct 2026",
    provenance: "needs_confirmation",
    confidence: "low",
  },
];

export const SOLANO_PROFILE_EDITS: ProfileEdit[] = [
  {
    field: "Business category",
    current: "Healthcare",
    proposed: "Healthcare Partners & Medical Supply Procurement",
    evidence:
      "Services page lists supply chain consulting and procurement support; confirmed by Maria Sep 28",
    confidence: "high",
  },
  {
    field: "Business hours",
    current: "Mon – Fri · 9:00 AM – 5:00 PM",
    proposed: "Mon – Fri · 8:00 AM – 6:00 PM",
    evidence:
      "Observed staff arrival at 7:55 AM on Oct 3 visit; Maria confirmed extended hours since Aug 2026",
    confidence: "high",
  },
  {
    field: "GBP booking link",
    current: "(not set)",
    proposed: "book.solanohealth.com/consult",
    evidence:
      "Booking page exists on website but not connected to GBP; direct link confirmed functional",
    confidence: "high",
  },
];

export const SOLANO_SALES_BRIEF: SalesBrief = {
  summary:
    "Solano Healthcare Partners is a Mid-Market retention account 23 days past last visit with refreshed Q4 budget. Digital presence has critical gaps — broken portal link, 12 unanswered reviews, and no directory listings. Addressing these builds trust before the supply consolidation pitch.",
  opportunityScore: 74,
  talkingPoints: [
    "Broken patient portal (404) is an immediate credibility risk — offer to escalate the fix to your digital team as a goodwill gesture before pitching",
    "12 unanswered reviews drag the 3.8 ★ rating — co-author responses with Maria this week; frame as protecting referral volume",
    "No Healthgrades or Zocdoc listing means 30–40% of referral traffic goes to competitors — this is a differentiated insight most reps miss",
  ],
  digitalGaps: [
    "Patient portal link broken (404) — high trust risk",
    "12 unanswered GBP reviews at 3.8 ★",
    "No Healthgrades or Zocdoc directory presence",
    "Mobile site 4.8s load — PageSpeed score 52/100",
  ],
  likelyNeeds: [
    "Amazon Business enrollment ($15K–25K/yr medical supplies)",
    "Office Depot Business tier upgrade (confirmed account)",
    "GBP booking integration (Zocdoc / native)",
    "Facility maintenance preferred pricing program",
  ],
  recommendedAction:
    "Open with the portal fix and review response offer — these cost nothing and build immediate goodwill. Transition to the directory gap insight, then pivot to the supply consolidation play once Maria is engaged.",
};

// ── Audit data accessor ───────────────────────────────────────────────────────
export type AuditBundle = {
  audit: AuditSection[];
  supplyOpps: SupplyOpportunity[];
  profileEdits: ProfileEdit[];
  salesBrief: SalesBrief;
};

export function getAuditData(accountId: string): AuditBundle {
  if (accountId === "solano") {
    return {
      audit: SOLANO_AUDIT,
      supplyOpps: SOLANO_SUPPLY_OPPS,
      profileEdits: SOLANO_PROFILE_EDITS,
      salesBrief: SOLANO_SALES_BRIEF,
    };
  }
  return {
    audit: APEX_AUDIT,
    supplyOpps: APEX_SUPPLY_OPPS,
    profileEdits: APEX_PROFILE_EDITS,
    salesBrief: APEX_SALES_BRIEF,
  };
}
