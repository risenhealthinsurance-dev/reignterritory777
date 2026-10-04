import type { Message } from "../types";

const t = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60 * 1000);

export const seedMessages: Message[] = [
  {
    id: "seed-1",
    role: "assistant",
    content:
      "Good morning. Today you have 6 accounts scheduled in the 90210 corridor. Traffic on the 405 is moderate — I'd recommend starting with the Wilshire cluster before heading west to Westside Distribution. Ready to lock in your route?",
    toolCalls: [],
    timestamp: t(52),
  },
  {
    id: "seed-2",
    role: "user",
    content: "Yes, plan my optimized route for today.",
    timestamp: t(50),
  },
  {
    id: "seed-3",
    role: "assistant",
    content:
      "Optimized. Starting with Meridian Medical Devices on Wilshire — highest revenue account and a 0.4-mile opener. You'll hit Pacific Rim Logistics on Camden next, then swing east to Apex Manufacturing on Beverly Blvd for your anchor stop. Solano Healthcare and Westside wrap the afternoon, and Bravo Industrial closes the loop back toward the 10. Total: 6 stops, 18.4 miles, estimated 3h 52min drive time. I've adjusted for the Sunset Blvd construction window — should have you done by 4:30 PM.",
    card: {
      type: "route",
      stops: [
        {
          accountId: "meridian",
          name: "Meridian Medical Devices",
          address: "9100 Wilshire Blvd",
          etaMinutes: 0,
          distanceMiles: 0.4,
        },
        {
          accountId: "pacific",
          name: "Pacific Rim Logistics",
          address: "433 N Camden Dr",
          etaMinutes: 8,
          distanceMiles: 1.1,
        },
        {
          accountId: "apex",
          name: "Apex Manufacturing Group",
          address: "8899 Beverly Blvd",
          etaMinutes: 22,
          distanceMiles: 3.2,
        },
        {
          accountId: "solano",
          name: "Solano Healthcare Partners",
          address: "345 N Maple Dr",
          etaMinutes: 37,
          distanceMiles: 2.4,
        },
        {
          accountId: "westside",
          name: "Westside Distribution Co",
          address: "1100 Glendon Ave",
          etaMinutes: 54,
          distanceMiles: 5.8,
        },
        {
          accountId: "bravo",
          name: "Bravo Industrial Supply",
          address: "8383 Wilshire Blvd",
          etaMinutes: 71,
          distanceMiles: 5.5,
        },
      ],
      totalMiles: 18.4,
      totalMinutes: 232,
    },
    toolCalls: [
      {
        name: "plan_route",
        args: '{ zip: "90210", accounts: 6, mode: "optimized" }',
        result: "6 stops · 18.4 mi · 3h 52m",
      },
    ],
    timestamp: t(49),
  },
  {
    id: "seed-4",
    role: "user",
    content:
      "Just finished Meridian. Sandra was in a meeting, spoke with her assistant. They want a Thursday call.",
    timestamp: t(28),
  },
  {
    id: "seed-5",
    role: "assistant",
    content:
      "Logged Meridian Medical Devices. Disposition: Contacted – DM Unavailable. I've noted you spoke with Sandra's assistant and flagged the Thursday callback. Want to log the outcome now or schedule the follow-up first?",
    card: {
      type: "disposition",
      accountId: "meridian",
    },
    toolCalls: [
      {
        name: "log_disposition",
        args: '{ account: "Meridian Medical Devices", status: "DM Unavailable" }',
        result: "Saved to CRM",
      },
    ],
    timestamp: t(26),
  },
  {
    id: "seed-6",
    role: "user",
    content: "Log it — Not Available, and schedule Thursday 9 AM follow-up.",
    timestamp: t(20),
  },
  {
    id: "seed-7",
    role: "assistant",
    content:
      "Done. Meridian is marked **Not Available** with a Thursday 9:00 AM callback queued. Sandra will get an email reminder the evening before. Pacific Rim Logistics is next — David Chen is your contact. Last visit was 11 days ago and he showed strong interest in the route optimization module. Pull up his account?",
    toolCalls: [
      {
        name: "log_disposition",
        args: '{ account: "Meridian Medical Devices", outcome: "Not Available" }',
        result: "Saved",
      },
      {
        name: "schedule_followup",
        args: '{ account: "Meridian Medical Devices", day: "Thursday", time: "9:00 AM" }',
        result: "Scheduled",
      },
    ],
    timestamp: t(18),
  },
  {
    id: "seed-8",
    role: "user",
    content: "Pull up Pacific Rim.",
    timestamp: t(10),
  },
  {
    id: "seed-9",
    role: "assistant",
    content:
      "Here's Pacific Rim Logistics. David Chen is your in — he has budget authority up to $75K and last time flagged strong interest in fleet telematics integration. They're evaluating Samsara, so come in with the ROI angle. Revenue opportunity this quarter: $38K.",
    card: {
      type: "account",
      accountId: "pacific",
    },
    toolCalls: [
      {
        name: "lookup_account",
        args: '{ id: "pacific" }',
        result: "Pacific Rim Logistics — Mid-Market",
      },
    ],
    timestamp: t(8),
  },
];
