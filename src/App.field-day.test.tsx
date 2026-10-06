import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderApp } from "./test/renderApp";

vi.mock("./components/MapView", () => ({
  MapView: () => <div aria-label="Map preview" />,
}));

test("lets the rep browse any quadrant while clearly recommending A1", async () => {
  const user = userEvent.setup();
  renderApp({ initialScreen: "territory" });

  expect(screen.getByText(/Fort Pierce 34950/i)).toBeInTheDocument();
  expect(screen.getByText(/A1 recommended/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^B1/i }));
  expect(screen.getByText(/B1 · QUADRANT/i)).toBeInTheDocument();
});

test("exposes one main region and named primary navigation", () => {
  renderApp({ initialScreen: "territory" });
  expect(screen.getByRole("main")).toBeInTheDocument();
  const navigation = screen.getByRole("navigation", { name: /Primary/i });
  expect(within(navigation).getByRole("button", { name: /Territory/i })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(navigation).getByRole("button", { name: /Today/i })).toBeInTheDocument();
  expect(within(navigation).getByRole("button", { name: /Field AI/i })).toBeInTheDocument();
  expect(within(navigation).getByRole("button", { name: /Summary/i })).toBeInTheDocument();
});

test("edits the suggested stop set and previews every route impact before applying", async () => {
  const user = userEvent.setup();
  renderApp({ initialScreen: "quad_route" });

  await user.click(
    screen.getByRole("button", { name: /Schedule Bravo Industrial Supply for later/i }),
  );
  await user.click(screen.getByRole("button", { name: /Add Bravo Industrial Supply back/i }));
  await user.click(
    screen.getByRole("button", { name: /Schedule Bravo Industrial Supply for later/i }),
  );
  await user.click(screen.getByRole("button", { name: /Preview route impact/i }));

  const preview = screen.getByRole("region", { name: /Route impact preview/i });
  expect(within(preview).getByText(/Commitments/i)).toBeInTheDocument();
  expect(within(preview).getByText(/Travel time/i)).toBeInTheDocument();
  expect(within(preview).getByText(/Expected value/i)).toBeInTheDocument();
  expect(within(preview).getByText(/Projected finish/i)).toBeInTheDocument();

  await user.click(within(preview).getByRole("button", { name: /Apply route/i }));
  expect(screen.getByText(/Route updated/i)).toBeInTheDocument();
});

test("separates GPS arrival confirmation from starting the visit", async () => {
  const user = userEvent.setup();
  renderApp({ initialScreen: "route" });

  await user.click(screen.getByRole("button", { name: /Open Apex Manufacturing Group/i }));
  expect(screen.getByText(/GPS suggests you are at this stop/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Confirm arrived/i }));
  expect(screen.getByRole("button", { name: /Start visit/i })).toBeInTheDocument();
  expect(screen.queryByText(/Visit in progress/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Start visit/i }));
  expect(screen.getByText(/Visit in progress/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Work This Business/i })).toBeInTheDocument();
});

test("requires outcome, note, and next action before visit review", async () => {
  const user = userEvent.setup();
  renderApp({ initialScreen: "route" });

  await user.click(screen.getByRole("button", { name: /Open Apex Manufacturing Group/i }));
  await user.click(screen.getByRole("button", { name: /Confirm arrived/i }));
  await user.click(screen.getByRole("button", { name: /Start visit/i }));
  await user.click(screen.getByRole("button", { name: /Work This Business/i }));
  await user.click(screen.getByRole("button", { name: /Callback/i }));

  const review = screen.getByRole("button", { name: /Review & Confirm/i });
  expect(review).toBeDisabled();
  await user.type(
    screen.getByPlaceholderText(/What happened/i),
    "Robert requested the compliance comparison.",
  );
  expect(review).toBeEnabled();
});

test("expands and collapses the route map", async () => {
  const user = userEvent.setup();
  renderApp({ initialScreen: "route" });

  await user.click(screen.getByRole("button", { name: /Open full-screen map/i }));
  expect(screen.getByRole("button", { name: /Collapse map/i })).toBeInTheDocument();
});
