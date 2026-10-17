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
