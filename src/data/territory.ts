import type { StopRecord } from "../types";

export interface Territory {
  id: string;
  name: string;
  repName: string;
  repTitle: string;
  date: string;
  targetRevenue: number;
  totalAccounts: number;
  region: string;
  trafficNote: string;
  weatherNote: string;
  priorityNote: string;
}

export const territory: Territory = {
  id: "ft-pierce-34950",
  name: "Fort Pierce A1 · ZIP 34950",
  repName: "Alex Rivera",
  repTitle: "Senior Account Executive",
  date: "Monday, Oct 6, 2026",
  targetRevenue: 51000000,
  totalAccounts: 6,
  region: "Fort Pierce · ZIP 34950",
  trafficNote:
    "US-1 moderate delay near downtown — add 8 min starting 7:30 AM. Orange Ave closed at 25th St.",
  weatherNote: "79°F, partly cloudy. No impact on stops.",
  priorityNote:
    "Solano Healthcare Partners (Mid-Market, $5.6M) — Q4 budget refresh Oct 1. Window open now.",
};

export const initialStops: StopRecord[] = [
  {
    accountId: "meridian",
    status: "done",
    disposition: "callback",
    dispositionNote:
      "Sandra reviewed revised pricing. Requested CFO sign-off by Oct 10. She is a champion.",
    nextAction: "Call CFO office Oct 10 AM",
    followUpDate: "Oct 10",
    followUpTime: "9:00 AM",
    arrivedAt: new Date("2026-10-06T08:47:00"),
    departedAt: new Date("2026-10-06T09:34:00"),
    syncStatus: "synced",
  },
  {
    accountId: "pacific",
    status: "done",
    disposition: "demo_set",
    dispositionNote: "Demo of route optimization module booked for Oct 9. David very engaged.",
    nextAction: "Send pre-demo materials by Oct 7",
    followUpDate: "Oct 9",
    followUpTime: "10:00 AM",
    arrivedAt: new Date("2026-10-06T09:52:00"),
    departedAt: new Date("2026-10-06T10:28:00"),
    syncStatus: "synced",
  },
  {
    accountId: "apex",
    status: "active",
    syncStatus: "local_only",
  },
  {
    accountId: "solano",
    status: "pending",
    syncStatus: "local_only",
  },
  {
    accountId: "westside",
    status: "failed",
    failureReason: "Contact unavailable — Tommy out of office, office manager couldn't authorize.",
    recoveryPlan: "reloop",
    syncStatus: "local_only",
  },
  {
    accountId: "bravo",
    status: "pending",
    syncStatus: "local_only",
  },
];

export const ROUTE_STATS = {
  totalMiles: 18.4,
  totalMinutes: 232,
  completedMiles: 6.2,
  completedMinutes: 101,
  remainingMiles: 12.2,
  remainingMinutes: 131,
};

export const OUTCOME_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: string;
  }
> = {
  sold: {
    label: "Sold",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: "🎯",
  },
  callback: {
    label: "Callback",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: "📞",
  },
  no_contact: {
    label: "No Contact",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    icon: "🚫",
  },
  not_interested: {
    label: "Not Interested",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    icon: "❌",
  },
  demo_set: {
    label: "Demo Set",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: "📅",
  },
  left_info: {
    label: "Left Info",
    color: "#6b7490",
    bg: "rgba(107,116,144,0.12)",
    icon: "📋",
  },
};
