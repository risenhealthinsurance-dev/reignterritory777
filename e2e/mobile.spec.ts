import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1280]) {
  test(`contains the MapGPT field-rep shell at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    if (await page.getByRole("heading", { name: "Sign in to Reign Territory" }).count()) {
      await expect(page.getByRole("heading", { name: "Sign in to Reign Territory" })).toBeVisible();
      return;
    }
    await expect(page.getByRole("region", { name: "Home map and assistant" })).toBeVisible();
    await expect(page.getByText("Ask Reign", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText(/location/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("all visible buttons have accessible names", async ({ page }) => {
  await page.goto("/");
  const unnamed = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons.filter((button) => !button.getAttribute("aria-label") && !button.textContent?.trim()).map((button) => button.outerHTML),
  );
  expect(unnamed).toEqual([]);
});

test("exposes production document metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Reign Territory");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("honors reduced-motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.animation = "spin 1s linear infinite";
    document.body.append(probe);
    return getComputedStyle(probe).animationDuration;
  });
  expect(["0.01ms", "1e-05s"]).toContain(duration);
});

test("audits the primary field-rep assistant and pipeline journey", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  if (await page.getByRole("heading", { name: "Sign in to Reign Territory" }).count()) return;

  await expect(page.getByText("Apex Manufacturing Group", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Talking points" }).click();
  await expect(page.getByText(/Here’s Apex Manufacturing Group/i)).toBeVisible();
  await page.getByRole("button", { name: "Record disposition" }).click();
  const disposition = page.locator('[role="dialog"]').filter({ hasText: "Record outcome" });
  await expect(disposition).toBeVisible();
  await expect(disposition.getByRole("button", { name: "Confirm draft" })).toBeDisabled();
  await disposition.getByLabel("Outcome").selectOption({ label: "Qualified" });
  await disposition.getByLabel("Notes").fill("Buyer requested a proposal comparison.");
  await disposition.getByRole("button", { name: "Confirm draft" }).click();
  await expect(page.getByText(/Disposition draft queued locally/i)).toBeVisible();
  await page.getByRole("button", { name: "Open pipeline" }).click();
  await expect(page.getByRole("heading", { name: "Current pipeline" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Discovery pipeline stage" })).toContainText("Apex Manufacturing Group");
  await expect(page.getByText(/Disposition: Qualified/i)).toBeVisible();

  const undersized = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons.filter((button) => {
      const box = button.getBoundingClientRect();
      return box.width < 44 || box.height < 44;
    }).map((button) => `${button.textContent?.trim()}: ${button.getBoundingClientRect().width}x${button.getBoundingClientRect().height}`),
  );
  expect(undersized).toEqual([]);
  expect(errors).toEqual([]);
});
