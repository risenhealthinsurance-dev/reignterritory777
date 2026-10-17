import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { MapGptShell } from "./MapGptShell";
import { listAgentActions } from "../lib/agentStore";

vi.mock("../components/MapView", () => ({
  MapView: (props: { routeStopIds?: string[]; onEntitySelect?: (entity: unknown) => void; onPinTap?: (id: string) => void }) => <div aria-label="Live territory map" data-route-stop-ids={props.routeStopIds?.join(",")}><button aria-label="Open Apex Manufacturing Group" onClick={() => props.onPinTap?.("apex")}>Open Apex marker</button><button onClick={() => props.onEntitySelect?.({ entityId: "mapbox-building-123", source: "mapbox-building", lat: 27.44, lng: -80.337, properties: {} })}>Select building</button></div>,
}));

beforeEach(() => localStorage.clear());

test("exposes exactly Home, Agent Studio, and Pipeline as primary navigation", () => {
  render(<MapGptShell />);
  const navigation = screen.getByRole("navigation", { name: /Primary/i });
  expect(screen.getAllByRole("button").filter((button) => navigation.contains(button))).toHaveLength(3);
  expect(screen.getByRole("button", { name: /Home/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Agent Studio/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Pipeline$/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Field AI|Territory|Route|Summary/i })).not.toBeInTheDocument();
});

test("selecting a business on Home scopes the assistant context", async () => {
  const user = userEvent.setup();
  render(<MapGptShell />);
  expect(screen.getByRole("region", { name: /Live Mapbox territory map/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Open Apex Manufacturing Group/i }));
  expect(screen.getAllByText(/Apex Manufacturing Group/).length).toBeGreaterThan(0);
  expect(screen.getByLabelText(/assistant context/i)).toHaveTextContent(/Apex Manufacturing Group/);
});

test("selecting a building creates an assistant entity context without a pin dialog", async () => {
  const user = userEvent.setup();
  render(<MapGptShell />);
  await user.click(screen.getByRole("button", { name: "Select building" }));
  expect(screen.getByLabelText(/assistant context/i)).toHaveTextContent(/Selected building/);
  expect(screen.getByLabelText(/assistant context/i)).toHaveTextContent(/Business name needed/);
  expect(screen.getByLabelText(/Edit selected business name/i)).toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: /Create map pin/i })).not.toBeInTheDocument();
});

test("opens Studio and Pipeline from the primary navigation", async () => {
  const user = userEvent.setup();
  render(<MapGptShell />);
  await user.click(screen.getByRole("button", { name: /Agent Studio/i }));
  expect(screen.getByRole("heading", { name: /Agent Studio/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Knowledge sources/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^Pipeline$/i }));
  expect(screen.getByRole("heading", { name: /Current pipeline/i })).toBeInTheDocument();
  expect(screen.getByText(/Apex Manufacturing Group/i)).toBeInTheDocument();
});

test("requires confirmation before creating a callback draft", async () => {
  const user = userEvent.setup();
  render(<MapGptShell />);

  await user.click(screen.getByRole("button", { name: /Schedule callback or appointment/i }));

  expect(screen.getByRole("dialog", { name: /Schedule callback or appointment/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Confirm draft/i })).toBeDisabled();

  await user.click(screen.getByLabelText(/Date/i));
  await user.keyboard("2026-10-20");
  await user.click(screen.getByLabelText("Start time"));
  await user.keyboard("10:30");
  await user.click(screen.getByLabelText("End time"));
  await user.keyboard("11:00");
  expect(screen.getByRole("button", { name: /Confirm draft/i })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: /Confirm draft/i }));

  expect(screen.queryByRole("dialog", { name: /Schedule callback or appointment/i })).not.toBeInTheDocument();
  expect(screen.getByText(/Queued locally/i)).toBeInTheDocument();
  expect(screen.getByLabelText("Live territory map")).toHaveAttribute("data-route-stop-ids", "apex,meridian,pacific,solano,westside,bravo");
  await user.click(screen.getByRole("button", { name: /^Pipeline$/i }));
  expect(screen.getByText(/Callback window: 2026-10-20 · 10:30–11:00/i)).toBeInTheDocument();
  const actions = listAgentActions();
  expect(actions).toEqual(expect.arrayContaining([
    expect.objectContaining({
      type: "schedule_follow_up",
      accountId: "apex",
      status: "queued",
      payload: { date: "2026-10-20", time: "10:30", endTime: "11:00", appointmentType: "window" },
    }),
  ]));
});

test("shows a confirmed disposition on the selected business and Pipeline card", async () => {
  const user = userEvent.setup();
  render(<MapGptShell />);

  await user.click(screen.getByRole("button", { name: /Record disposition/i }));
  await user.selectOptions(screen.getByLabelText("Outcome"), "Connected");
  await user.type(screen.getByLabelText("Notes"), "Spoke with operations lead");
  await user.click(screen.getByRole("button", { name: /Confirm draft/i }));

  expect(screen.getByText(/Disposition: Connected/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /^Pipeline$/i }));
  expect(screen.getByText(/Disposition: Connected/i)).toBeInTheDocument();
});
