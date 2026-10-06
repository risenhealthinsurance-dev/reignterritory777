import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1280]) {
  test(`contains the application at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Fort Pierce 34950" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);

    const shell = page.locator("[data-app-shell]");
    await expect(shell).toHaveCSS("width", `${Math.min(width, 390)}px`);
    if (width > 390) await expect(shell).toHaveCSS("max-width", "390px");
  });
}

test("all visible buttons have accessible names", async ({ page }) => {
  await page.goto("/");
  const unnamed = await page
    .locator("button:visible")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => !button.getAttribute("aria-label") && !button.textContent?.trim())
        .map((button) => button.outerHTML),
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

test("audits the complete primary tab journey on a field-rep viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");

  await expect(page.getByRole("main").first()).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fort Pierce 34950" })).toBeVisible();

  await expect(page.getByRole("heading", { name: /Solano Healthcare Partners|Apex Manufacturing/i })).toBeVisible();
  await page.getByRole("button", { name: /Start visit/i }).click();
  await page.getByRole("button", { name: /Confirm arrived/i }).click();
  await page.getByRole("button", { name: /Start visit/i }).click();
  await page.getByRole("button", { name: /Work This Business/i }).click();
  await page.getByRole("button", { name: /Callback/i }).click();
  await page.getByPlaceholder(/What happened/i).fill("Buyer requested a proposal comparison.");
  await page.getByRole("button", { name: /Review & Confirm/i }).click();
  await page.getByRole("button", { name: /confirm & save/i }).click();
  await expect(page.getByText(/ROUTE ACTIVE|Today field cockpit/i).first()).toBeVisible();
  await expect(page.getByText(/ROUTE ACTIVE|Today field cockpit/i).first()).toBeVisible();

  await navigation.getByRole("button", { name: /Field AI/i }).click();
  await expect(page.getByRole("heading", { name: "Field AI" })).toBeVisible();
  await expect(page.getByText(/Nothing is recorded in the background/i)).toBeVisible();

  await navigation.getByRole("button", { name: /Summary/i }).click();
  await expect(page.getByRole("heading", { name: "Day Summary" })).toBeVisible();
  await expect(page.getByText(/Resolve every unfinished stop/i)).toBeVisible();

  const undersized = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const box = button.getBoundingClientRect();
        return box.width < 44 || box.height < 44;
      })
      .map(
        (button) =>
          `${button.textContent?.trim()}: ${button.getBoundingClientRect().width}x${button.getBoundingClientRect().height}`,
      ),
  );
  expect(undersized).toEqual([]);
  expect(errors).toEqual([]);
});
