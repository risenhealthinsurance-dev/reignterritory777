import type { Message } from '../types'

const t = (m: number) => new Date(Date.now() - m * 60 * 1000)

export interface Scenario {
  id: string
  label: string
  emoji: string
  description: string
  doneIds: string[]
  messages: Message[]
}

export const scenarios: Scenario[] = [
  // ── 1. Morning Route Plan ──────────────────────────────
  {
    id: 'route',
    label: 'Route Plan',
    emoji: '🗺',
    description: 'Morning kickoff — AI plans the day',
    doneIds: [],
    messages: [
      {
        id: 'r1', role: 'assistant',
        content: "Good morning. Today you have 6 accounts in the 90210 corridor. Traffic on the 405 is moderate — I'd recommend starting with the Wilshire cluster before heading west. Ready to lock in your route?",
        toolCalls: [], timestamp: t(12),
      },
      { id: 'r2', role: 'user', content: 'Yes, plan my optimized route.', timestamp: t(11) },
      {
        id: 'r3', role: 'assistant',
        content: "Optimized. Starting with Meridian Medical Devices on Wilshire — highest revenue and closest to your position. You'll loop north to Pacific Rim, then east to Apex Manufacturing for your anchor stop. Solano and Westside wrap the afternoon. Total: **6 stops, 18.4 miles, 3h 52min**. Adjusted for the Sunset Blvd construction — done by 4:30 PM.",
        card: {
          type: 'route',
          stops: [
            { accountId: 'meridian', name: 'Meridian Medical Devices', address: '9100 Wilshire Blvd', etaMinutes: 0, distanceMiles: 0.4 },
            { accountId: 'pacific', name: 'Pacific Rim Logistics', address: '433 N Camden Dr', etaMinutes: 8, distanceMiles: 1.1 },
            { accountId: 'apex', name: 'Apex Manufacturing Group', address: '8899 Beverly Blvd', etaMinutes: 22, distanceMiles: 3.2 },
            { accountId: 'solano', name: 'Solano Healthcare Partners', address: '345 N Maple Dr', etaMinutes: 37, distanceMiles: 2.4 },
            { accountId: 'westside', name: 'Westside Distribution Co', address: '1100 Glendon Ave', etaMinutes: 54, distanceMiles: 5.8 },
            { accountId: 'bravo', name: 'Bravo Industrial Supply', address: '8383 Wilshire Blvd', etaMinutes: 71, distanceMiles: 5.5 },
          ],
          totalMiles: 18.4, totalMinutes: 232,
        },
        toolCalls: [{ name: 'plan_route', args: '{ zip: "90210", accounts: 6 }', result: '6 stops · 18.4 mi · 3h 52m' }],
        timestamp: t(10),
      },
    ],
  },

  // ── 2. Disposition & Follow-up ────────────────────────
  {
    id: 'disposition',
    label: 'Log Visit',
    emoji: '📋',
    description: 'Post-visit disposition and scheduling',
    doneIds: ['meridian', 'pacific'],
    messages: [
      { id: 'd1', role: 'user', content: "Just left Apex. Robert was in but said he needs board sign-off before Q4. Seems promising though.", timestamp: t(6) },
      {
        id: 'd2', role: 'assistant',
        content: "Got it — Apex Manufacturing. Let's log this visit. Robert Garza is your champion and the board approval is the blocker. Select the outcome and I'll write the CRM note automatically.",
        card: { type: 'disposition', accountId: 'apex' },
        toolCalls: [{ name: 'log_disposition', args: '{ account: "Apex Manufacturing Group" }', result: 'Ready to log' }],
        timestamp: t(5),
      },
      { id: 'd3', role: 'user', content: 'Mark it — Callback. Note: board meeting is Oct 14, follow up Oct 15.', timestamp: t(3) },
      {
        id: 'd4', role: 'assistant',
        content: "Done. Apex Manufacturing logged as **Callback** with your note attached. I've queued a follow-up for **Oct 15 at 9:00 AM** with a pre-call brief pulled from today's visit. Next stop: Solano Healthcare on Maple — Maria Trevino, best reached before noon.",
        toolCalls: [
          { name: 'log_disposition', args: '{ outcome: "Callback" }', result: 'Saved' },
          { name: 'schedule_followup', args: '{ date: "Oct 15", time: "9:00 AM" }', result: 'Scheduled' },
        ],
        timestamp: t(1),
      },
    ],
  },

  // ── 3. Account Lookup ─────────────────────────────────
  {
    id: 'account',
    label: 'Account Intel',
    emoji: '🏢',
    description: 'Pre-call account briefing',
    doneIds: ['meridian', 'pacific', 'apex'],
    messages: [
      { id: 'a1', role: 'user', content: "Pull up Solano Healthcare. I'm 5 min out.", timestamp: t(8) },
      {
        id: 'a2', role: 'assistant',
        content: "Here's your pre-call brief for Solano Healthcare Partners. Maria Trevino is Director of Supply Chain — hard to reach, best window is Tuesday/Thursday mornings. Budget refreshed October 1st so timing is excellent. They had an unresolved voicemail from Sep 10. Lead with the PPE sourcing pain point from your August discovery call.",
        card: { type: 'account', accountId: 'solano' },
        toolCalls: [{ name: 'lookup_account', args: '{ id: "solano" }', result: 'Solano Healthcare — Mid-Market' }],
        timestamp: t(7),
      },
      { id: 'a3', role: 'user', content: "What's their renewal date and main competitor?", timestamp: t(4) },
      {
        id: 'a4', role: 'assistant',
        content: "Renewal is Q1 2027 — about 5 months out, which puts this visit at the right time to start the conversation. Their current vendor is Medline Industries. Notes from August show Medline has had two back-order issues on PPE this year — that's your wedge. Pricing is within 8% of their current contract.",
        toolCalls: [{ name: 'lookup_account', args: '{ detail: "contract" }', result: 'Q1 2027 renewal' }],
        timestamp: t(2),
      },
    ],
  },

  // ── 4. EOD Summary ────────────────────────────────────
  {
    id: 'summary',
    label: 'EOD Summary',
    emoji: '📊',
    description: 'End-of-day recap sent to manager',
    doneIds: ['meridian', 'pacific', 'apex', 'solano', 'westside'],
    messages: [
      { id: 's1', role: 'user', content: "Wrapping up. Give me my EOD summary.", timestamp: t(5) },
      {
        id: 's2', role: 'assistant',
        content: "Strong day. You hit 5 of 6 accounts — Bravo Industrial had to be rescheduled due to a facility closure. Two solid pipeline advances at Apex and Pacific Rim. Here's your summary ready to send:",
        card: {
          type: 'summary',
          accountsVisited: 5,
          callsLogged: 7,
          salesMade: 1,
          milesDriven: 14.2,
          topAccounts: [
            { name: 'Apex Manufacturing Group', outcome: 'Callback — board meeting Oct 14, follow-up scheduled' },
            { name: 'Pacific Rim Logistics', outcome: 'Proposal sent — decision expected within 10 days' },
            { name: 'Westside Distribution Co', outcome: 'Closed SMB starter · 2 referral leads collected' },
          ],
        },
        toolCalls: [{ name: 'send_summary', args: '{ to: "manager" }', result: 'Ready to send' }],
        timestamp: t(4),
      },
      { id: 's3', role: 'user', content: "Send it.", timestamp: t(2) },
      {
        id: 's4', role: 'assistant',
        content: "Sent to your manager at 5:12 PM. Tomorrow I'll have Bravo Industrial rescheduled and a pre-call brief ready for your 9 AM Meridian callback. Good work today — 5 accounts, 14 miles, 1 close. 🎯",
        toolCalls: [{ name: 'send_summary', args: '{}', result: 'Delivered ✓' }],
        timestamp: t(1),
      },
    ],
  },

  // ── 5. Follow-up Scheduling ───────────────────────────
  {
    id: 'followup',
    label: 'Schedule',
    emoji: '📅',
    description: 'Book follow-ups mid-conversation',
    doneIds: ['meridian'],
    messages: [
      { id: 'f1', role: 'user', content: "Sandra at Meridian wants a Thursday call. Can you book it and remind her?", timestamp: t(9) },
      {
        id: 'f2', role: 'assistant',
        content: "On it. Pick a time for Thursday and I'll block your calendar, notify Sandra, and add a pre-call agenda with the revised pricing deck she requested.",
        card: { type: 'followup', accountId: 'meridian' },
        toolCalls: [{ name: 'schedule_followup', args: '{ account: "Meridian Medical Devices" }', result: 'Pending time selection' }],
        timestamp: t(8),
      },
      { id: 'f3', role: 'user', content: "Thursday 10 AM.", timestamp: t(5) },
      {
        id: 'f4', role: 'assistant',
        content: "Locked. **Thursday 10:00 AM — Meridian Medical Devices**, Sandra Kowalski. Calendar blocked, Sandra has been notified, and I'll send you a pre-call brief Wednesday evening with the Q4 pricing deck attached. Anything else before your next stop?",
        toolCalls: [
          { name: 'schedule_followup', args: '{ day: "Thursday", time: "10:00 AM" }', result: 'Confirmed' },
          { name: 'update_crm', args: '{ account: "Meridian" }', result: 'Synced' },
        ],
        timestamp: t(3),
      },
    ],
  },
]
