import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { createInitialRepDay, resolveStop } from "../domain/repDay";
import { SummaryScreen } from "./SummaryScreen";

const callbacks = () => ({ onResolveStop: vi.fn(), onSync: vi.fn(), onCloseDay: vi.fn(), onSendToManager: vi.fn(), onRecordCorrection: vi.fn() });

test("separates unfinished stops from records waiting to sync", () => {
  const day = createInitialRepDay();
  render(<SummaryScreen day={day} {...callbacks()} />);
  expect(screen.getByText("4", { selector: "[data-metric='unfinished']" })).toBeInTheDocument();
  expect(screen.getByText("1", { selector: "[data-metric='unsynced']" })).toBeInTheDocument();
  expect(screen.getAllByText(/Westside Distribution Co/i).length).toBeGreaterThan(0);
});

test("requires every unfinished stop to be resolved before closeout", async () => {
  const user = userEvent.setup();
  const props = callbacks();
  render(<SummaryScreen day={createInitialRepDay()} {...props} />);
  expect(screen.getByRole("button", { name: /Close day/i })).toBeDisabled();
  await user.click(screen.getAllByRole("button", { name: /Move to tomorrow/i })[0]);
  expect(props.onResolveStop).toHaveBeenCalledWith("apex", { kind: "tomorrow" });
});

test("closes offline on device and explains that server sync is still pending", () => {
  let day = createInitialRepDay();
  for (const stop of day.stops.filter((candidate) => candidate.resolution === "unresolved")) day = resolveStop(day, stop.accountId, { kind: "territory_pool" });
  day = { ...day, closedAt: new Date("2026-10-04T17:00:00-04:00"), closeoutSyncState: "closed_on_device" };
  render(<SummaryScreen day={day} isOffline {...callbacks()} />);
  expect(screen.getByText(/Closed on this device/i)).toBeInTheDocument();
  expect(screen.getByText(/Fully synced after connectivity returns/i)).toBeInTheDocument();
});

test("requires review and an explicit send for the manager summary", async () => {
  const user = userEvent.setup();
  const props = callbacks();
  render(<SummaryScreen day={createInitialRepDay()} {...props} />);
  await user.click(screen.getByRole("button", { name: /Review manager summary/i }));
  expect(screen.getByRole("dialog", { name: /Review manager handoff/i })).toBeInTheDocument();
  expect(screen.getByText(/^Destination$/i)).toBeInTheDocument();
  expect(props.onSendToManager).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: /Send summary/i }));
  expect(props.onSendToManager).toHaveBeenCalledTimes(1);
});

test("records post-close corrections with an audit reason", async () => {
  const user = userEvent.setup();
  const props = callbacks();
  const day = { ...createInitialRepDay(), closedAt: new Date(), closeoutSyncState: "fully_synced" as const };
  render(<SummaryScreen day={day} {...props} />);
  await user.click(screen.getByRole("button", { name: /Correct Meridian Medical Devices/i }));
  await user.type(screen.getByLabelText(/Correction reason/i), "Manager confirmed the next action by phone");
  await user.click(screen.getByRole("button", { name: /Record audited correction/i }));
  expect(props.onRecordCorrection).toHaveBeenCalledWith(expect.objectContaining({ accountId: "meridian", reason: expect.stringContaining("Manager confirmed") }));
});
