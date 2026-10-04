import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { initialStops } from "../data/territory";
import { SummaryScreen } from "./SummaryScreen";

test("groups failed reloops and requests only a local sync transition", async () => {
  const user = userEvent.setup();
  const onSync = vi.fn();
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(<SummaryScreen stops={initialStops} onSync={onSync} onSendToManager={() => undefined} />);

  await user.click(screen.getByRole("button", { name: /Reloop/i }));
  expect(screen.getByText(/Failed visit/i)).toBeInTheDocument();
  expect(screen.getByText(/Reloop after next stop/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Unsynced/i }));
  expect(screen.getByText(/Failed visit · reloop queued/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /SYNC NOW/i }));

  expect(onSync).toHaveBeenCalledTimes(1);
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("keeps errored records retryable", async () => {
  const user = userEvent.setup();
  const onSync = vi.fn();
  const errored = initialStops.map((stop) =>
    stop.accountId === "apex" ? { ...stop, syncStatus: "error" as const } : stop,
  );
  render(<SummaryScreen stops={errored} onSync={onSync} onSendToManager={() => undefined} />);

  await user.click(screen.getByRole("button", { name: /Unsynced/i }));
  expect(screen.getByText("ERROR")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /SYNC NOW/i }));
  expect(onSync).toHaveBeenCalledTimes(1);
});
