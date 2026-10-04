import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { accounts } from "./data/accounts";
import { DispositionScreen } from "./screens/DispositionScreen";
import { FollowUpScreen } from "./screens/FollowUpScreen";
import { RecoveryScreen } from "./screens/RecoveryScreen";

const apex = accounts.find((account) => account.id === "apex")!;
const westside = accounts.find((account) => account.id === "westside")!;

test("requires an outcome and confirms a disposition only once", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(<DispositionScreen account={apex} onConfirm={onConfirm} onCancel={() => undefined} />);

  expect(screen.getByRole("button", { name: /Review & Confirm/i })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /Sold/i }));
  await user.type(screen.getByPlaceholderText(/What happened/i), "Order approved by buyer.");
  await user.click(screen.getByRole("button", { name: /Review & Confirm/i }));
  await user.click(screen.getByRole("button", { name: /confirm & save/i }));
  await user.dblClick(screen.getByRole("button", { name: /Back to Route/i }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledWith(
    expect.objectContaining({ stopId: "apex", outcome: "sold" }),
  );
});

test("requires date and time and confirms a follow-up only once", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(<FollowUpScreen account={apex} onConfirm={onConfirm} onCancel={() => undefined} />);

  expect(screen.getByRole("button", { name: /Select a date and time/i })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /Mon 6 Oct/i }));
  await user.click(screen.getByRole("button", { name: "9:00 AM" }));
  await user.click(screen.getByRole("button", { name: /Review & Confirm/i }));
  await user.click(screen.getByRole("button", { name: /save locally/i }));
  await user.dblClick(screen.getByRole("button", { name: /Back to Route/i }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledWith(
    expect.objectContaining({ stopId: "apex", time: "9:00 AM" }),
  );
});

test("opens a failed stop with its recovery plan and applies it only once", async () => {
  const user = userEvent.setup();
  const onReloop = vi.fn();
  render(
    <RecoveryScreen
      account={westside}
      initialFailureReason="Contact unavailable — Tommy out of office"
      initialRecoveryPlan="reloop"
      onSkip={() => undefined}
      onReloop={onReloop}
      onCallAhead={() => undefined}
      onCancel={() => undefined}
    />,
  );

  expect(screen.getByRole("button", { name: /Contact unavailable/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: /Reloop after next stop/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await user.click(screen.getByRole("button", { name: /Review Recovery Plan/i }));
  await user.dblClick(screen.getByRole("button", { name: /Confirm — Reloop/i }));

  expect(onReloop).toHaveBeenCalledTimes(1);
  expect(onReloop).toHaveBeenCalledWith("westside", "Contact unavailable");
});
