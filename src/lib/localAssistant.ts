import type { Account } from "../data/accounts";

function verifiedOrNot(value: string | undefined, fallback = "Not verified") {
  return value?.trim() ? value.trim() : fallback;
}

export function buildLocalAssistantResponse(prompt: string, account: Account): string {
  const normalized = prompt.toLowerCase();
  const contact = verifiedOrNot(account.contact.name);
  const title = verifiedOrNot(account.contact.title);
  const note = verifiedOrNot(account.notes);
  const latestActivity = verifiedOrNot(account.activities[0]?.summary);

  if (/brief|talking|account|who|contact/.test(normalized)) {
    return `Here’s ${account.name}. Your contact is ${contact}, ${title}. Latest verified activity: ${latestActivity}. Rep note: ${note}.`;
  }

  if (/next|action|do|recommend/.test(normalized)) {
    return `Next action for ${account.name}: reconnect with ${contact}. ${latestActivity} Keep the conversation focused on the verified account context. Additional commercial intelligence is ${note === "Not verified" ? "Not verified" : "available in the account notes"}.`;
  }

  return `I’m keeping this scoped to ${account.name}. Ask for a brief, talking points, or the next action. I’ll label anything that is not verified.`;
}
