import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AUDIT_STEP_DELAY_MS, FieldAIScreen } from "./FieldAIScreen";

afterEach(() => vi.useRealTimers());

test("requires business context and approval before queuing an edit", async () => {
  vi.useFakeTimers();
  render(<FieldAIScreen />);

  fireEvent.click(screen.getByRole("button", { name: /Select a business/i }));
  fireEvent.click(screen.getByRole("button", { name: /Solano Healthcare Partners/i }));
  fireEvent.click(screen.getByRole("button", { name: /Run digital-marketing audit/i }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUDIT_STEP_DELAY_MS * 6 + 500);
  });

  fireEvent.click(screen.getAllByRole("button", { name: /Review/i })[0]!);
  expect(screen.getByText(/no automatic saves or CRM writes/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Approve · Queue for review/i }));

  expect(screen.getByText(/queued for manual submission · not saved/i)).toBeInTheDocument();
});
