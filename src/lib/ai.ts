import type { CardData, Message, RouteStop } from "../types";
import { accounts } from "../data/accounts";

export interface AIResponse {
  textGen: AsyncGenerator<string>;
  card?: CardData;
}

export async function* streamText(text: string, delayMs = 18): AsyncGenerator<string> {
  for (const char of text) {
    yield char;
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

type Intent = "route" | "disposition" | "followup" | "account" | "summary" | "note" | "general";

function detectIntent(msg: string): Intent {
  const m = msg.toLowerCase();
  if (/\b(eod|end of day|summary|wrap up|daily recap)\b/.test(m)) return "summary";
  if (/\b(route|plan|optimize|stops|navigate|directions)\b/.test(m)) return "route";
  if (/\b(follow.?up|schedule|next visit|call back thursday|book|calendar)\b/.test(m))
    return "followup";
  if (
    /\b(log|disposition|sold|not interested|not available|callback|left info|visit|outcome)\b/.test(
      m,
    )
  )
    return "disposition";
  if (/\b(look up|lookup|pull up|account|find|show me|who is|contact)\b/.test(m)) return "account";
  if (/\b(note|add note|remember|jot)\b/.test(m)) return "note";
  return "general";
}

function extractAccountId(msg: string): string {
  const m = msg.toLowerCase();
  for (const acc of accounts) {
    if (m.includes(acc.name.toLowerCase()) || m.includes(acc.id)) return acc.id;
  }
  // guess from partial name
  if (/meridian/.test(m)) return "meridian";
  if (/pacific/.test(m)) return "pacific";
  if (/apex/.test(m)) return "apex";
  if (/solano/.test(m)) return "solano";
  if (/westside/.test(m)) return "westside";
  if (/bravo/.test(m)) return "bravo";
  // return the first undone account
  return accounts.find((a) => !a.done)?.id ?? accounts[0].id;
}

const ROUTE_TEXTS = [
  "Optimized route locked in for the day. I've sequenced all 6 accounts to minimize backtracking and avoid the Sunset construction zone. Starting tight on Wilshire and working outward — Meridian Medical first since Sandra's availability window closes at 11 AM. Total drive: 18.4 miles, 3h 52min moving time. You should be clear by 4:30 PM with buffer for extended stops.",
  "Route planned. I've ordered your stops to cluster the Beverly Hills accounts before pushing west toward Westside Distribution — saves you 23 minutes versus north-south ordering. Traffic on Wilshire is light right now but expect slowdown after 3 PM on the return. I'll alert you if it changes.",
];

const DISPOSITION_TEXTS = [
  "Got it. I'll log that visit now — select the outcome below and add any notes. It'll sync to CRM automatically once you confirm.",
  "Logging this visit. Pick the disposition outcome and I'll write up the CRM entry, timestamp it, and queue any follow-up actions you want.",
];

const FOLLOWUP_TEXTS = [
  "Scheduling the follow-up. Pick a day and time below — I'll block it on your calendar, send the account contact a heads-up, and add a pre-call brief to your morning summary that day.",
  "Let's get that follow-up locked in. Select your preferred slot and I'll handle the calendar entry and the reminder.",
];

const ACCOUNT_TEXTS: Record<string, string> = {
  meridian:
    "Here's Meridian Medical Devices. Sandra Kowalski is your champion — she's VP of Operations and has been your contact for 2 years. Revenue opportunity this quarter: $142K renewal. Last visit 18 days ago. They requested a revised pricing deck at the last meeting — make sure you have that ready.",
  pacific:
    "Pacific Rim Logistics is up next. David Chen controls procurement with up to $75K authority — no board approval needed at this tier. He flagged strong interest in the route optimization module last visit. Competitive situation with Samsara, so lead with the ROI case study.",
  apex: "Apex Manufacturing Group — your highest-revenue account on territory at $22.1M ARR. Robert Garza is the CPO and an internal champion. The Sep 29 plant walkthrough surfaced 3 additional SKU opportunities. Board approval required for the enterprise tier but Robert is actively pushing it upstairs.",
  solano:
    "Solano Healthcare Partners. Maria Trevino is Director of Supply Chain and hard to catch — best window is Tuesday and Thursday mornings. Budget refreshed October 1st, so timing is excellent. Last contact was 23 days ago and she hadn't received a callback from the Sep 10 voicemail.",
  westside:
    "Westside Distribution Co — Tommy Park, owner-operator. He actually closed last month on the SMB starter package. This visit is a relationship check-in. He mentioned knowing 4–5 similar operators in the area who might be warm referrals.",
  bravo:
    "Bravo Industrial Supply is your longest-dormant account — 49 days since last contact. Lisa Okonkwo was evaluating a competitor in August. This is a re-engagement visit. Lead with the new bulk pricing tier and the Q4 incentive window.",
};

const SUMMARY_TEXTS = [
  "Here's your end-of-day summary. You covered significant ground today — solid mix of enterprise anchor visits and mid-market relationship building. I've compiled stats, top interactions, and the send-to-manager summary below.",
];

const NOTE_TEXTS = [
  "Note saved to the account record. Anything else you want to capture before your next stop?",
  "Done — added to the account notes and timestamped. I'll surface this in your pre-call brief next time you visit.",
];

const GENERAL_TEXTS = [
  "On it. What account or stop does this relate to?",
  "Understood. I've noted that. Want me to tie it to a specific account or log it as a standalone note?",
  "Got it. Your next stop is Apex Manufacturing Group — Robert Garza, CPO. The Sep 29 plant walkthrough surfaced 3 additional SKU opportunities worth following up on.",
];

function buildRouteCard(): CardData {
  const stops: RouteStop[] = accounts.map((a, i) => ({
    accountId: a.id,
    name: a.name,
    address: a.address.split(",")[0],
    etaMinutes: [0, 8, 22, 37, 54, 71][i] ?? i * 12,
    distanceMiles: [0.4, 1.1, 3.2, 2.4, 5.8, 5.5][i] ?? i * 1.5,
  }));
  return { type: "route", stops, totalMiles: 18.4, totalMinutes: 232 };
}

function buildSummaryCard(): CardData {
  return {
    type: "summary",
    accountsVisited: 4,
    callsLogged: 6,
    salesMade: 1,
    milesDriven: 14.2,
    topAccounts: [
      {
        name: "Apex Manufacturing Group",
        outcome: "Presentation completed — follow-up scheduled",
      },
      {
        name: "Pacific Rim Logistics",
        outcome: "Proposal sent — decision pending",
      },
      {
        name: "Westside Distribution Co",
        outcome: "Check-in complete — referral leads collected",
      },
    ],
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getAIResponse(userMessage: string, _context: Message[]): AIResponse {
  const intent = detectIntent(userMessage);
  const accountId = extractAccountId(userMessage);

  switch (intent) {
    case "route":
      return {
        textGen: streamText(pick(ROUTE_TEXTS)),
        card: buildRouteCard(),
      };
    case "disposition":
      return {
        textGen: streamText(pick(DISPOSITION_TEXTS)),
        card: { type: "disposition", accountId },
      };
    case "followup":
      return {
        textGen: streamText(pick(FOLLOWUP_TEXTS)),
        card: { type: "followup", accountId },
      };
    case "account": {
      const text =
        ACCOUNT_TEXTS[accountId] ??
        `Here's the account record for ${accounts.find((a) => a.id === accountId)?.name ?? "that account"}.`;
      return {
        textGen: streamText(text),
        card: { type: "account", accountId },
      };
    }
    case "summary":
      return {
        textGen: streamText(pick(SUMMARY_TEXTS)),
        card: buildSummaryCard(),
      };
    case "note":
      return { textGen: streamText(pick(NOTE_TEXTS)) };
    default:
      return { textGen: streamText(pick(GENERAL_TEXTS)) };
  }
}
