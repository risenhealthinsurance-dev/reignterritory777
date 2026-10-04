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
    zoom: 13.8,
    pitch: 45,
    bearing: -10,
  });
});
