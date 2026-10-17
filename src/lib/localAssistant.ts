import type { Account } from "../data/accounts";
import type { AgentAction } from "../contracts/fieldAgent";
import { findLatestDispositionAction, findNextScheduledAction } from "./routePriority";

function verifiedOrNot(value: string | undefined, fallback = "Not verified") {
  return value?.trim() ? value.trim() : fallback;
}

export function buildLocalAssistantResponse(prompt: string, account: Account, actions: AgentAction[] = []): string {
  const normalized = prompt.toLowerCase();
  const contact = verifiedOrNot(account.contact.name);
  const title = verifiedOrNot(account.contact.title);
  const note = verifiedOrNot(account.notes);
  const latestActivity = verifiedOrNot(account.activities[0]?.summary);
  const scheduled = findNextScheduledAction(actions, account.id);
  const disposition = findLatestDispositionAction(actions, account.id);
  const scheduledPayload = scheduled?.payload && typeof scheduled.payload === "object" ? scheduled.payload as { date?: unknown; time?: unknown; endTime?: unknown; appointmentType?: unknown } : null;
  const scheduleContext = scheduledPayload?.date && scheduledPayload.time
    ? `Scheduled ${scheduledPayload.appointmentType === "hard" ? "appointment" : "callback window"}: ${scheduledPayload.date} at ${scheduledPayload.time}${scheduledPayload.endTime ? `–${scheduledPayload.endTime}` : ""}.`
    : "No scheduled callback is recorded.";
  const dispositionOutcome = disposition?.payload && typeof disposition.payload === "object" ? (disposition.payload as { outcome?: unknown }).outcome : null;
  const dispositionContext = dispositionOutcome ? `Latest disposition: ${String(dispositionOutcome)}.` : "No disposition is recorded yet.";

  if (/brief|talking|account|who|contact/.test(normalized)) {
    return `Here’s ${account.name}. Your contact is ${contact}, ${title}. Latest verified activity: ${latestActivity}. Rep note: ${note}.`;
  }

  if (/next|action|do|recommend/.test(normalized)) {
    return `Next action for ${account.name}: reconnect with ${contact}. ${scheduleContext} ${dispositionContext} ${latestActivity} Keep the conversation focused on the verified account context. Additional commercial intelligence is ${note === "Not verified" ? "Not verified" : "available in the account notes"}.`;
  }

  return `I’m keeping this scoped to ${account.name}. Ask for a brief, talking points, or the next action. I’ll label anything that is not verified.`;
}
