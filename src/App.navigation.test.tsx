import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { renderApp } from "./test/renderApp";

vi.mock("./components/MapView", () => ({
  MapView: () => <div aria-label="Map preview" />,
}));

test("opens on territory so the rep chooses today's work first", () => {
  renderApp();
  expect(screen.getByRole("heading", { name: /Fort Pierce 34950/i })).toBeInTheDocument();
  expect(screen.getByText(/Choose today's work/i)).toBeInTheDocument();
});

test("moves from territory through A1 to the route", async () => {
  const user = userEvent.setup();
  renderApp({ initialScreen: "territory" });

  await user.click(screen.getByRole("button", { name: /^A1/i }));
  await user.click(screen.getByRole("button", { name: /Plan suggested route/i }));
  await user.click(screen.getByRole("button", { name: /Preview route impact/i }));
  await user.click(screen.getByRole("button", { name: /Apply route/i }));
  await user.click(screen.getByRole("button", { name: /Start route/i }));

  expect(screen.getByText(/ROUTE ACTIVE · 34950 · A1/i)).toBeInTheDocument();
});

test("recovers invalid account selections to the route", () => {
  renderApp({ initialScreen: "stop", initialAccountId: "missing-account" });

  expect(screen.getByText(/ROUTE ACTIVE · 34950 · A1/i)).toBeInTheDocument();
});
