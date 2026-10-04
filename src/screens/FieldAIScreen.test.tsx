import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { FieldAIScreen } from "./FieldAIScreen";

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
  await user.click(screen.getByRole("button", { name: /Hold to talk/i }));
  expect(screen.getByRole("button", { name: /Stop recording/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Stop recording/i }));
  expect(screen.getByText(/Voice note ready/i)).toBeInTheDocument();
});

test("shows evidence source, date, confidence, and fact versus inference", async () => {
  const user = userEvent.setup();
  render(<FieldAIScreen currentAccountId="apex" />);

  await user.click(screen.getByRole("button", { name: /30-second brief/i }));
  expect(screen.getByText(/Source: CRM visit history/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Updated Oct 4, 2026/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/High confidence/i)).toBeInTheDocument();
  expect(screen.getByText(/^Fact$/i)).toBeInTheDocument();
  expect(screen.getByText(/^AI inference$/i)).toBeInTheDocument();
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
