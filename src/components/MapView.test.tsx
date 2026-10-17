import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { accounts } from "../data/accounts";

const mapConstructor = vi.fn((_options: Record<string, unknown>) => ({
  on: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  isStyleLoaded: vi.fn(() => false),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: mapConstructor,
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      getElement: vi.fn(() => document.createElement("div")),
    })),
    accessToken: "",
  },
}));

beforeEach(() => {
  mapConstructor.mockClear();
  vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "");
});

test("renders a usable fallback when no Mapbox token is configured", async () => {
  const onPinTap = vi.fn();
  const { MapView } = await import("./MapView");
  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId={null}
      doneAccountIds={["meridian"]}
      onPinTap={onPinTap}
    />,
  );

  expect(screen.getByLabelText("Route map fallback")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Apex Manufacturing/i }));
  expect(onPinTap).toHaveBeenCalledWith("apex");
  expect(mapConstructor).not.toHaveBeenCalled();
});

test("builds the live route from Fort Pierce account coordinates", async () => {
  const module = (await import("./MapView")) as unknown as {
    getRouteCoordinates: (items: typeof accounts) => [number, number][];
    FORT_PIERCE_CENTER: [number, number];
  };
  expect(module.FORT_PIERCE_CENTER).toEqual([-80.337, 27.44]);
  expect(module.getRouteCoordinates(accounts)).toEqual(
    accounts.map((account) => [account.lng, account.lat]),
  );
});

test("shows territory context in the fallback", async () => {
  const { MapView } = await import("./MapView");
  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId={null}
      doneAccountIds={[]}
      onPinTap={() => undefined}
      showTerritoryMode
    />,
  );

  expect(screen.getByLabelText("Territory map fallback")).toHaveTextContent(
    "24 available · A1 recommended",
  );
});

test("renders the mobile cockpit actions in fallback mode", async () => {
  const { MapView } = await import("./MapView");
  render(
    <MapView
      height={520}
      accounts={accounts}
      activeAccountId="apex"
      doneAccountIds={[]}
      onPinTap={() => undefined}
      cockpitAccount={accounts.find((account) => account.id === "apex")}
      showCockpit
      onNavigate={() => undefined}
      onCall={() => undefined}
      onSchedule={() => undefined}
      onDisposition={() => undefined}
    />,
  );

  expect(screen.getByRole("region", { name: /Next best business: Apex/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Schedule Apex Manufacturing/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Set disposition for Apex/i })).toBeInTheDocument();
});

test("constructs the interactive route map when a token is configured", async () => {
  vi.resetModules();
  vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "test-public-token");
  const { MapView } = await import("./MapView");

  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId="apex"
      doneAccountIds={[]}
      onPinTap={() => undefined}
    />,
  );

  await waitFor(() => expect(mapConstructor).toHaveBeenCalled());
  expect(mapConstructor.mock.calls[0]?.[0]).toMatchObject({
    center: [-80.337, 27.44],
    zoom: 15.2,
    pitch: 58,
    bearing: -10,
  });
});

test("selects walking and driving camera modes with hysteresis", async () => {
  const module = (await import("./MapView")) as unknown as {
    getMovementMode: (speed: number | null | undefined, previous: "walking" | "driving") => "walking" | "driving";
    getCameraPreset: (mode: "walking" | "driving") => { zoom: number; pitch: number };
  };

  expect(module.getMovementMode(5, "driving")).toBe("walking");
  expect(module.getMovementMode(15, "walking")).toBe("driving");
  expect(module.getMovementMode(10, "driving")).toBe("driving");
  expect(module.getMovementMode(10, "walking")).toBe("walking");
  expect(module.getMovementMode(null, "driving")).toBe("driving");
  expect(module.getCameraPreset("walking").zoom).toBeGreaterThan(module.getCameraPreset("driving").zoom);
  expect(module.getCameraPreset("walking").pitch).toBeGreaterThan(0);
});

test("normalizes compass headings for the map camera", async () => {
  const module = (await import("./MapView")) as unknown as {
    normalizeHeading: (heading: number | null | undefined) => number;
  };

  expect(module.normalizeHeading(-45)).toBe(315);
  expect(module.normalizeHeading(405)).toBe(45);
  expect(module.normalizeHeading(undefined)).toBe(0);
});
