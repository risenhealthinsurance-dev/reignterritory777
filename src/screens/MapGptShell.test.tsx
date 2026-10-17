import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { MapGptShell } from "./MapGptShell";

vi.mock("../components/MapView", () => ({
  MapView: () => <div aria-label="Live territory map" />,
}));

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
  await user.click(screen.getByRole("button", { name: /Apex Manufacturing Group/i }));
  expect(screen.getAllByText(/Apex Manufacturing Group/).length).toBeGreaterThan(0);
  expect(screen.getByLabelText(/assistant context/i)).toHaveTextContent(/Apex Manufacturing Group/);
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
  expect(screen.getByText(/Draft approved locally/i)).toBeInTheDocument();
});
