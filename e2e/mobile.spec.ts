import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1280]) {
  test(`contains the application at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByText(/GOOD MORNING · FIELD AI READY/)).toBeVisible();

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
