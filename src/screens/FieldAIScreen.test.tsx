import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { FieldAIScreen } from "./FieldAIScreen";

const fieldAiResult = {
  status: "complete" as const,
  answer: "Lead with the verified compliance comparison.",
  facts: [
    {
      text: "The buyer requested a compliance comparison.",
      evidenceIds: ["evidence-1"],
      confidence: "high" as const,
      sources: [
        {
          id: "evidence-1",
          name: "Representative visit note",
          url: null,
          retrievedAt: "2026-10-04T12:00:00.000Z",
        },
      ],
    },
  ],
  inferences: [
    {
      text: "This is likely the strongest opening.",
      evidenceIds: ["evidence-1"],
      confidence: "medium" as const,
    },
  ],
  uncertainties: ["Decision timing is not verified."],
  confidence: "high" as const,
  suggestedActions: [],
};

test("inherits the current route stop and allows an explicit context change", async () => {
  const user = userEvent.setup();
  render(<FieldAIScreen currentAccountId="apex" />);

  expect(screen.getByText(/Current route stop/i)).toBeInTheDocument();
  expect(screen.getAllByText(/@Apex Manufacturing Group/i).length).toBeGreaterThan(0);

  await user.click(screen.getByRole("button", { name: /Change account/i }));
  await user.click(screen.getByRole("button", { name: /Solano Healthcare Partners/i }));
  expect(screen.getAllByText(/@Solano Healthcare Partners/i).length).toBeGreaterThan(0);
});

test("uses rep-controlled push-to-talk and never implies background listening", async () => {
  const user = userEvent.setup();
  render(<FieldAIScreen currentAccountId="apex" />);

  expect(screen.getByText(/Nothing is recorded in the background/i)).toBeInTheDocument();
  await user.pointer({
    keys: "[MouseLeft>]",
    target: screen.getByRole("button", { name: /Hold to talk/i }),
  });
  expect(screen.getByRole("button", { name: /Stop recording/i })).toBeInTheDocument();
  await user.pointer({
    keys: "[/MouseLeft]",
    target: screen.getByRole("button", { name: /Stop recording/i }),
  });
  expect(screen.getByText(/Voice note ready/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Prior interactions/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Capture visit note/i })).toBeInTheDocument();
});

test("shows evidence source, date, confidence, and fact versus inference", async () => {
  const user = userEvent.setup();
  const ask = vi.fn().mockResolvedValue(fieldAiResult);
  render(<FieldAIScreen currentAccountId="apex" fieldAiClient={{ ask }} />);

  await user.click(screen.getByRole("button", { name: /30-second brief/i }));
  expect(
    await screen.findByText(/Lead with the verified compliance comparison/i),
  ).toBeInTheDocument();
  expect(screen.getByText(/Source: Representative visit note/i)).toBeInTheDocument();
  expect(screen.getByText(/Updated Oct 4, 2026/i)).toBeInTheDocument();
  expect(screen.getAllByText(/High confidence/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/^Fact$/i)).toBeInTheDocument();
  expect(screen.getByText(/^AI inference$/i)).toBeInTheDocument();
  expect(screen.getByText(/Decision timing is not verified/i)).toBeInTheDocument();
  expect(ask).toHaveBeenCalledWith(
    expect.objectContaining({
      scope: { type: "account", accountId: "apex" },
      intent: "brief",
    }),
  );
});

test("shows a recoverable error instead of a fabricated answer", async () => {
  const user = userEvent.setup();
  render(
    <FieldAIScreen
      currentAccountId="apex"
      fieldAiClient={{ ask: vi.fn().mockRejectedValue(new Error("Provider unavailable")) }}
    />,
  );

  await user.click(screen.getByRole("button", { name: /30-second brief/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Provider unavailable/i);
  expect(screen.queryByText(/Lead with compliance readiness/i)).not.toBeInTheDocument();
});

test("stops recording when the pointer is released outside the control", () => {
  render(<FieldAIScreen currentAccountId="apex" />);
  const button = screen.getByRole("button", { name: /Hold to talk/i });
  fireEvent.pointerDown(button, { pointerId: 1 });
  expect(screen.getByRole("button", { name: /Stop recording/i })).toBeInTheDocument();
  fireEvent.pointerUp(window, { pointerId: 1 });
  expect(screen.getByRole("button", { name: /Hold to talk/i })).toBeInTheDocument();
});

test("uses cached briefs offline and queues network-dependent research", async () => {
  const user = userEvent.setup();
  const onQueueAction = vi.fn();
  render(<FieldAIScreen currentAccountId="apex" isOffline onQueueAction={onQueueAction} />);

  expect(screen.getByText(/Cached brief · updated/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Run deeper research/i }));
  expect(screen.getByText(/Queued until connectivity returns/i)).toBeInTheDocument();
  expect(onQueueAction).toHaveBeenCalledWith(expect.objectContaining({ type: "research" }));
});

test("previews the destination and exact change before approval", async () => {
  const user = userEvent.setup();
  const onQueueAction = vi.fn();
  render(<FieldAIScreen currentAccountId="apex" onQueueAction={onQueueAction} />);

  await user.click(screen.getByRole("button", { name: /Draft follow-up/i }));
  expect(screen.getByRole("dialog", { name: /Review AI draft/i })).toBeInTheDocument();
  expect(screen.getByText(/^Destination$/i)).toBeInTheDocument();
  expect(screen.getByText(/CRM follow-up queue/i)).toBeInTheDocument();
  expect(screen.getByText(/^Before$/i)).toBeInTheDocument();
  expect(screen.getByText(/^After$/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Approve draft/i }));
  expect(screen.getByText(/Approved · queued locally/i)).toBeInTheDocument();
  expect(onQueueAction).toHaveBeenCalledWith(expect.objectContaining({ type: "follow_up" }));
});
