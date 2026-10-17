import { expect, test } from "vitest";
import { accounts } from "../data/accounts";
import { buildLocalAssistantResponse } from "./localAssistant";

test("builds a business-scoped fallback response for the selected account", () => {
  const account = accounts.find((candidate) => candidate.id === "pacific")!;

  const response = buildLocalAssistantResponse("What should I do next?", account);

  expect(response).toContain("Pacific Rim Logistics");
  expect(response).toContain("David Chen");
  expect(response).not.toContain("Apex Manufacturing Group");
});

test("labels missing live account intelligence as unverified", () => {
  const account = { ...accounts[0], notes: "", activities: [], contact: { ...accounts[0].contact, name: "Contact not yet verified" } };

  const response = buildLocalAssistantResponse("Give me a brief", account);

  expect(response).toContain("Meridian Medical Devices");
  expect(response).toContain("Not verified");
});

test("uses queued appointment and disposition context in the next-action answer", () => {
  const account = accounts.find((candidate) => candidate.id === "apex")!;
  const response = buildLocalAssistantResponse("What should I do next?", account, [
    { id: "follow-up", type: "schedule_follow_up", status: "queued", accountId: "apex", payload: { date: "2026-10-25", time: "13:00", endTime: "14:00", appointmentType: "window" }, sourceMessageId: "m1", createdAt: "2026-10-17T12:00:00.000Z" },
    { id: "disposition", type: "record_disposition", status: "queued", accountId: "apex", payload: { outcome: "Connected" }, sourceMessageId: "m2", createdAt: "2026-10-17T12:05:00.000Z" },
  ]);
  expect(response).toContain("Scheduled callback window: 2026-10-25 at 13:00–14:00.");
  expect(response).toContain("Latest disposition: Connected.");
});
