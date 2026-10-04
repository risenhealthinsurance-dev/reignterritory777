# ReignTerritory777 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Figma Make Reign Territory experience as a tested React application in `risenhealthinsurance-dev/reignterritory777`.

**Architecture:** Import the exported Figma Make React application as the visual and behavioral baseline, then harden it in small test-first slices. Keep navigation and domain mutations local to the React application, isolate Mapbox behind a token-aware component, and preserve every designed approval boundary.

**Tech Stack:** React 19, TypeScript 5.7, Vite 8, Tailwind CSS 4, Mapbox GL JS 3, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-reignterritory777-design.md`

## Global Constraints

- The current Figma Make preview, exported source, and exported handoff are the source of truth in that order.
- Preserve all twelve screens and the four post-kickoff navigation groups.
- The visual baseline is a 390 CSS-pixel-wide mobile viewport.
- Keep the application client-only with deterministic sample data.
- No CRM, calendar, messaging, AI-service, or other external write is permitted.
- Every consequential mutation retains its explicit review or confirmation step.
- Read Mapbox credentials only from `VITE_MAPBOX_ACCESS_TOKEN`; never track a real token.
- Without a Mapbox token, the application must render a styled, usable map fallback.
- Touch targets are at least 44px and the bottom navigation respects safe-area insets.
- The repository destination is `risenhealthinsurance-dev/reignterritory777`.

## Review Focus

- Missing `VITE_MAPBOX_ACCESS_TOKEN` must show the fallback without constructing a Mapbox map.
- An unknown selected account or stop ID must recover to a valid route screen rather than render an empty panel.
- Narrow viewports down to 320px must not produce horizontal document overflow.
- Double activation of confirmation controls must not apply a disposition or follow-up twice.
- Reduced-motion users must not receive pulsing or spinning animations.

---

### Task 1: Import and normalize the Figma Make baseline

**Files:**

- Copy: exported `src/` to `src/`
- Copy: exported `index.html`, `package.json`, `pnpm-lock.yaml`, and `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

**Interfaces:**

- Consumes: the downloaded Figma Make archive at `C:/Users/USUARIO/Downloads/Mobile UI Layout with AI Chat.zip`
- Produces: a buildable `App` default export from `src/App.tsx` and the `npm run build`, `npm test`, `npm run typecheck`, and `npm run format:check` commands used by later tasks

- [ ] **Step 1: Copy the generated baseline without its Figma-only runtime metadata**

Extract the archive to a temporary directory. Copy `src/`, `index.html`, `package.json`, `pnpm-lock.yaml`, and `tsconfig.json` into the repository. Do not copy `.mcp.json`, `.figma/make`, `CLAUDE.md`, the exported `AGENTS.md`, or the old `plans/` directory.

- [ ] **Step 2: Replace the Figma-specific Vite configuration**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
```

- [ ] **Step 3: Add test and quality dependencies and scripts**

Add `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `@vitest/coverage-v8`, `jsdom`, `vitest`, and `typescript` as development dependencies. Set scripts to:

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit",
  "format": "oxfmt .",
  "format:check": "oxfmt --check ."
}
```

- [ ] **Step 4: Add repository hygiene files**

Create `.gitignore` containing `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.local`, and editor/OS artifacts. Create `.env.example` containing only:

```dotenv
VITE_MAPBOX_ACCESS_TOKEN=
```

Document Node 22+, `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm run typecheck`, `pnpm run build`, and the optional Mapbox variable in `README.md`.

- [ ] **Step 5: Remove the exported credential before the first commit**

In `src/components/MapView.tsx`, delete the literal `mapboxgl.accessToken = 'pk.…'` assignment and replace it with:

```ts
const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();
if (mapboxAccessToken) mapboxgl.accessToken = mapboxAccessToken;
```

Run `rg "pk\." src` and require no output. Task 3 adds the complete no-token fallback before release.

- [ ] **Step 6: Install and verify the imported baseline**

Run: `pnpm install && pnpm run typecheck && pnpm run build`

Expected: dependency installation completes, TypeScript reports no errors, and Vite emits `dist/`.

- [ ] **Step 7: Commit**

```bash
git add .gitignore .env.example README.md index.html package.json pnpm-lock.yaml tsconfig.json vite.config.ts src
git commit -m "feat: import Reign Territory Figma application"
```

### Task 2: Establish the test harness and navigation contract

**Files:**

- Create: `src/test/setup.ts`
- Create: `src/test/renderApp.tsx`
- Create: `src/App.navigation.test.tsx`
- Modify: `vite.config.ts`
- Modify: `src/App.tsx`

**Interfaces:**

- Consumes: `App` from `src/App.tsx`
- Produces: `renderApp(): RenderResult`, stable accessible names for primary navigation, and automatic recovery from invalid selection state

- [ ] **Step 1: Configure Vitest and browser mocks**

Extend `vite.config.ts` with `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: true }`. In `src/test/setup.ts`, import `@testing-library/jest-dom/vitest`, install a minimal `ResizeObserver` stub, and mock `mapbox-gl` so baseline navigation tests do not require WebGL.

- [ ] **Step 2: Write failing kickoff and route navigation tests**

```tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "./test/renderApp";

test("opens on kickoff and starts the route", async () => {
  const user = userEvent.setup();
  renderApp();
  expect(screen.getByText(/GOOD MORNING · FIELD AI READY/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Resume Route|Start Today's Route/i }));
  expect(screen.getByText("TODAY'S ROUTE")).toBeInTheDocument();
});

test("moves from territory through A1 to the route", async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole("button", { name: /TERRITORY/i }));
  await user.click(screen.getByRole("button", { name: /A1/i }));
  await user.click(screen.getByRole("button", { name: /Enter A1|Plan Route/i }));
  await user.click(screen.getByRole("button", { name: /Start Loop/i }));
  expect(screen.getByText("TODAY'S ROUTE")).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the navigation tests and confirm the expected failure**

Run: `pnpm vitest run src/App.navigation.test.tsx`

Expected: FAIL because the harness and/or stable accessible navigation names do not yet exist.

- [ ] **Step 4: Implement only the harness and accessibility changes needed by the tests**

Create `renderApp` as a thin wrapper around Testing Library's `render(<App />)`. Add `aria-label` values to ambiguous icon buttons and preserve all visible Figma copy.

- [ ] **Step 5: Add the invalid-identifier regression test**

Expose an optional `initialState` prop solely as a typed application bootstrap contract:

```tsx
renderApp({ initialScreen: "stop", initialAccountId: "missing-account" });
expect(screen.getByText("TODAY'S ROUTE")).toBeInTheDocument();
expect(screen.queryByTestId("empty-panel")).not.toBeInTheDocument();
```

Run the test and verify it fails because the exported app currently falls through to an empty panel.

- [ ] **Step 6: Implement invalid-selection recovery**

Add a guarded effect in `App` that changes `stop`, `disposition`, `followup`, or `recovery` to `route` when the selected account or stop cannot be resolved. Keep valid navigation unchanged.

- [ ] **Step 7: Verify and commit**

Run: `pnpm vitest run src/App.navigation.test.tsx && pnpm run typecheck`

Expected: all navigation tests pass and TypeScript reports no errors.

```bash
git add src/test src/App.navigation.test.tsx src/App.tsx vite.config.ts
git commit -m "test: lock application navigation behavior"
```

### Task 3: Secure Mapbox and provide the visual fallback

**Files:**

- Create: `src/components/MapFallback.tsx`
- Create: `src/components/MapView.test.tsx`
- Modify: `src/components/MapView.tsx`
- Modify: `src/index.css`

**Interfaces:**

- Consumes: existing `MapViewProps`
- Produces: `MapFallback(props: Pick<MapViewProps, 'height' | 'accounts' | 'activeAccountId' | 'doneAccountIds' | 'showTerritoryMode' | 'onPinTap'>)` and token-aware `MapView`

- [ ] **Step 1: Write the failing missing-token test**

```tsx
test("renders a usable fallback when no Mapbox token is configured", async () => {
  vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "");
  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId={null}
      doneAccountIds={[]}
      onPinTap={onPinTap}
    />,
  );
  expect(screen.getByLabelText("Route map fallback")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Apex Manufacturing/i }));
  expect(onPinTap).toHaveBeenCalledWith("apex");
  expect(Map).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test and confirm it fails for the hard-coded token**

Run: `pnpm vitest run src/components/MapView.test.tsx`

Expected: FAIL because the component assigns a literal token and constructs Mapbox.

- [ ] **Step 3: Implement the token boundary and fallback**

Read `const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()`. Render `MapFallback` when empty. The fallback uses the same 340px slot, dark map texture, route/territory overlay copy, numbered account buttons, done checkmarks, and active state. Assign `mapboxgl.accessToken = token` only inside the token-present path.

- [ ] **Step 4: Add and pass the configured-token test**

Stub a non-secret token and assert the Mapbox constructor receives the exported route camera settings. Run the test once before implementation to observe failure, then add the minimal branch and rerun.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/components/MapView.test.tsx && pnpm run typecheck`

Expected: both fallback and configured-token tests pass; `rg "pk\." src` returns no matches.

```bash
git add src/components/MapFallback.tsx src/components/MapView.tsx src/components/MapView.test.tsx src/index.css
git commit -m "feat: add secure map configuration and fallback"
```

### Task 4: Lock route mutations and approval gates

**Files:**

- Create: `src/App.route-flows.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/screens/DispositionScreen.tsx`
- Modify: `src/screens/FollowUpScreen.tsx`
- Modify: `src/screens/RecoveryScreen.tsx`

**Interfaces:**

- Consumes: `StopRecord`, `DraftDisposition`, and `FollowUpDraft` from `src/types.ts`
- Produces: idempotent confirmation handlers and disabled confirmation buttons until required fields are selected

- [ ] **Step 1: Write failing disposition tests**

Drive kickoff → route → Apex → Work This Business. Assert the review button is disabled before an outcome is chosen, then choose an outcome, review it, and confirm. Assert Apex displays `Done` on the route.

- [ ] **Step 2: Run the disposition test and confirm the behavioral gap**

Run: `pnpm vitest run src/App.route-flows.test.tsx -t disposition`

Expected: FAIL on whichever exported behavior lacks the required disabled state, accessible label, or return-state assertion.

- [ ] **Step 3: Implement the minimal disposition hardening**

Add a local `submitting` guard around the final callback and disable the button after its first activation. Do not change the three-step draft → review → success sequence.

- [ ] **Step 4: Add failing follow-up and recovery tests**

Test that follow-up cannot advance without both date and time, that one confirmation creates one saved state, and that opening Westside from Route displays its preselected failure reason and reloop plan before returning to Route.

- [ ] **Step 5: Implement idempotent follow-up and recovery confirmations**

Use the same one-shot local guard in each screen. Preserve the existing selected data and visible confirmation summaries.

- [ ] **Step 6: Verify and commit**

Run: `pnpm vitest run src/App.route-flows.test.tsx && pnpm run typecheck`

Expected: disposition, follow-up, recovery, and double-activation tests pass.

```bash
git add src/App.tsx src/App.route-flows.test.tsx src/screens/DispositionScreen.tsx src/screens/FollowUpScreen.tsx src/screens/RecoveryScreen.tsx
git commit -m "test: protect route workflow confirmations"
```

### Task 5: Lock Field AI and summary behavior

**Files:**

- Create: `src/screens/FieldAIScreen.test.tsx`
- Create: `src/screens/SummaryScreen.test.tsx`
- Modify: `src/screens/FieldAIScreen.tsx`
- Modify: `src/screens/SummaryScreen.tsx`

**Interfaces:**

- Consumes: `getAuditData(accountId)` and `StopRecord[]`
- Produces: deterministic Field AI phase transitions and truthful local-only summary/sync states

- [ ] **Step 1: Write the failing Field AI phase test**

```tsx
test("requires business context and approval before queuing an edit", async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<FieldAIScreen />);
  await user.click(screen.getByRole("button", { name: /Select Business/i }));
  await user.click(screen.getByRole("button", { name: /Solano Healthcare Partners/i }));
  await user.click(screen.getByRole("button", { name: /digital-marketing audit/i }));
  await vi.runAllTimersAsync();
  await user.click(screen.getByRole("button", { name: /Review proposed edit/i }));
  expect(screen.getByText(/no automatic saves/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Approve/i }));
  expect(screen.getByText(/queued.*not saved/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm the exported timing or accessible-name failure**

Run: `pnpm vitest run src/screens/FieldAIScreen.test.tsx`

Expected: FAIL until deterministic timers and stable action labels are available.

- [ ] **Step 3: Make Field AI deterministic without changing its visible phases**

Represent phase delays with one exported `AUDIT_STEP_DELAY_MS` constant, label the action controls, and ensure Approve/Reject return to results with distinct local banners.

- [ ] **Step 4: Write failing summary grouping and simulated-sync tests**

Render `SummaryScreen` with the exported initial stops. Assert Westside appears under Reloop and Unsynced as `Failed visit · reloop queued`. Activate Sync Now and assert the control progresses through `Syncing` to the prototype's local `Synced` display without making `fetch` or XHR calls. Add a retry assertion for a stop seeded with `syncStatus: 'error'`.

- [ ] **Step 5: Implement only the truthful local state transitions**

Keep sync state inside the screen or parent callback. Never call a network API and never label the result as a CRM write.

- [ ] **Step 6: Verify and commit**

Run: `pnpm vitest run src/screens/FieldAIScreen.test.tsx src/screens/SummaryScreen.test.tsx && pnpm run typecheck`

Expected: all phase, approval, grouping, no-network, and retry tests pass.

```bash
git add src/screens/FieldAIScreen.tsx src/screens/FieldAIScreen.test.tsx src/screens/SummaryScreen.tsx src/screens/SummaryScreen.test.tsx
git commit -m "test: lock Field AI and summary state machines"
```

### Task 6: Accessibility, responsive containment, and visual verification

**Files:**

- Create: `e2e/mobile.spec.ts`
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `src/index.css`
- Modify: task-relevant components identified by accessibility assertions

**Interfaces:**

- Consumes: the complete app and the `pnpm dev` server
- Produces: Playwright `webServer` configuration and viewport-level regression coverage

- [ ] **Step 1: Add Playwright and write the failing responsive test**

```ts
for (const width of [320, 390, 1280]) {
  test(`contains the application at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    if (width > 390) await expect(page.locator("#root > *")).toHaveCSS("max-width", "390px");
  });
}
```

Add tests that every visible button has a non-empty accessible name and that `prefers-reduced-motion: reduce` disables `pin-pulse` and `spin` animation durations.

- [ ] **Step 2: Run Playwright and observe the current failures**

Run: `pnpm exec playwright test e2e/mobile.spec.ts`

Expected: FAIL on desktop containment, one or more ambiguous controls, or reduced-motion handling.

- [ ] **Step 3: Implement containment and reduced-motion CSS**

Center the application shell, set `width: 100%` and `max-width: 390px`, prevent horizontal overflow, retain `100dvh`, and add:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Capture and compare the target viewport**

Run the app at 390×844 and capture kickoff, route, territory, Field AI results, and summary screenshots. Compare them side by side with the Figma preview. Correct in-scope differences in typography, spacing, color, hierarchy, asset placement, and fixed/scrolling behavior. Re-run the focused screenshot after each correction.

- [ ] **Step 5: Verify and commit**

Run: `pnpm exec playwright test && pnpm test && pnpm run typecheck && pnpm run build`

Expected: all browser and unit tests pass, TypeScript reports no errors, and the production build exits zero.

```bash
git add e2e playwright.config.ts package.json pnpm-lock.yaml src
git commit -m "feat: verify responsive and accessible mobile experience"
```

### Task 7: Final documentation, repository creation, and push

**Files:**

- Modify: `README.md`
- Verify: all tracked files

**Interfaces:**

- Consumes: verified local `main` branch
- Produces: public or private GitHub repository `risenhealthinsurance-dev/reignterritory777` using the account's default visibility policy

- [ ] **Step 1: Add the final README usage and prototype-boundary checks**

Document the screen inventory, local-only behavior, Mapbox fallback, commands, and explicit non-goals. Verify that no README statement claims a live CRM, AI, sync, or messaging integration.

- [ ] **Step 2: Run the complete fresh verification suite**

Run:

```bash
pnpm run format:check
pnpm run typecheck
pnpm test
pnpm exec playwright test
pnpm run build
git status --short
git grep -n "pk\." -- ':!pnpm-lock.yaml'
```

Expected: every command exits zero; `git status --short` contains only the intentional README change before commit; the token search prints nothing.

- [ ] **Step 3: Commit documentation**

```bash
git add README.md
git commit -m "docs: document Reign Territory prototype"
```

- [ ] **Step 4: Create the GitHub repository**

Using the authenticated GitHub account, create `risenhealthinsurance-dev/reignterritory777` without initializing it with a README, license, or `.gitignore`. Use the account's default repository visibility because the user did not specify public or private.

- [ ] **Step 5: Rename the branch and push**

```bash
git branch -M main
git remote add origin https://github.com/risenhealthinsurance-dev/reignterritory777.git
git push -u origin main
```

- [ ] **Step 6: Verify the remote result**

Confirm the GitHub repository page visibly shows the latest commit, `README.md`, `src/`, and both `docs/superpowers/specs/` and `docs/superpowers/plans/`. Confirm the remote default branch is `main`.
