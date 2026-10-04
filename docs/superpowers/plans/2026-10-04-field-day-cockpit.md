# Field-Day Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement and verify the approved four-tab field-day workflow in the existing Reign Territory React application.

**Architecture:** Introduce a focused `RepDay` domain model and pure transition helpers, then adapt each tab to consume that shared state. Preserve the existing visual system while replacing contradictory sample data and disconnected screen-local behavior with tested cross-tab flows.

**Tech Stack:** React 19, TypeScript 5.7, Vite 8, Vitest, React Testing Library, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-04-field-day-cockpit.md`

## Global Constraints

- Deterministic client-side prototype; no external CRM, messaging, or AI writes.
- Fort Pierce 34950 is the only sample geography.
- Route change, AI draft, closeout, send, and correction actions require review gates.
- Full offline workflow with truthful unresolved/unsynced separation.
- 390px visual baseline, 320px containment, 44px touch targets, semantic landmarks.

## Review Focus

- Pending untouched stops must not inflate the unsynced count.
- Arrival confirmation must not implicitly start the visit timer.
- A rejected route-change preview must leave route order and commitments unchanged.
- Offline closeout must preserve queued mutations and show `closed on device` rather than `fully synced`.
- Field AI must never lose or silently change its visible account context.

---

### Task 1: Establish the RepDay model and coherent Fort Pierce data

**Files:**
- Create: `src/domain/repDay.ts`
- Create: `src/domain/repDay.test.ts`
- Modify: `src/types.ts`
- Modify: `src/data/accounts.ts`
- Modify: `src/data/territory_grid.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `createInitialRepDay()`, `getSyncQueue(day)`, `previewRouteChange(day, ids)`, `applyRouteChange(day, proposalId)`, `resolveStop(day, stopId, resolution)`.
- Consumers: Tasks 2–4 use the same `RepDay` transitions through `App` callbacks.

- [ ] Write tests asserting Fort Pierce geography, suggested editable stops, route-impact metrics, protected commitments, and unresolved/unsynced separation.
- [ ] Run `pnpm vitest run src/domain/repDay.test.ts` and confirm failure because the domain module does not exist.
- [ ] Implement the minimal pure model and replace all California sample locations with Fort Pierce 34950 data.
- [ ] Run the focused test and complete unit suite; expect all tests to pass.
- [ ] Commit as `feat: establish field-day domain model`.

### Task 2: Build Territory planning and Route cockpit

**Files:**
- Create: `src/App.field-day.test.tsx`
- Modify: `src/screens/TerritoryOverviewScreen.tsx`
- Modify: `src/screens/ActiveQuadrantScreen.tsx`
- Modify: `src/screens/QuadrantRouteScreen.tsx`
- Modify: `src/screens/RouteScreen.tsx`
- Modify: `src/screens/StopScreen.tsx`
- Modify: `src/screens/DispositionScreen.tsx`
- Modify: `src/components/MapFallback.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 1 route proposals and visit states.
- Produces: accessible controls for quadrant browsing, candidate editing, impact preview, map expansion, arrival confirmation, visit start, visit logging, next-stop recommendation, and End Day review.

- [ ] Write interaction tests for browse-all/recommend-one Territory behavior, editable suggested route preview, GPS suggestion → Arrived → Start Visit separation, and required outcome/note/next action.
- [ ] Run `pnpm vitest run src/App.field-day.test.tsx` and confirm the new flow fails against the current UI.
- [ ] Implement the Territory planner and next-best-action cockpit, preserving existing visual tokens.
- [ ] Run focused tests, existing navigation/route tests, and typecheck; expect all to pass.
- [ ] Commit as `feat: add territory planner and route cockpit`.

### Task 3: Convert Field AI into the contextual sales copilot

**Files:**
- Modify: `src/screens/FieldAIScreen.tsx`
- Modify: `src/screens/FieldAIScreen.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: current stop/account, online state, cached evidence, and sync queue callbacks from `App`.
- Produces: visible account context, territory-wide mode, push-to-talk state, evidence cards, specialist-tool labels, offline queueing, and approval previews.

- [ ] Add failing tests for inherited current-stop context, account switching, push-to-talk, evidence metadata, offline cached labels, queued research, and approval-gated drafts.
- [ ] Run the focused Field AI tests and confirm expected failures.
- [ ] Implement the sales-copilot landing and deterministic specialist results without network calls.
- [ ] Run focused tests and the unit suite; expect all to pass.
- [ ] Commit as `feat: make Field AI context aware`.

### Task 4: Implement closeout, handoff, offline close, and corrections

**Files:**
- Modify: `src/screens/SummaryScreen.tsx`
- Modify: `src/screens/SummaryScreen.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: unresolved records, sync queue, and `resolveStop` from Task 1.
- Produces: reviewed closeout state, manager-summary draft preview, local offline closure, separate send approval, and audited correction records.

- [ ] Add failing tests for unresolved/unsynced separation, per-stop resolution, offline local close, manager draft review before send, and correction audit history.
- [ ] Run focused Summary tests and confirm expected failures.
- [ ] Implement the closeout workspace and explicit review states; retain local-only wording.
- [ ] Run focused tests and the complete unit suite; expect all to pass.
- [ ] Commit as `feat: add end-of-day closeout workflow`.

### Task 5: Accessibility, browser QA, production delivery, and reloop verification

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/BottomNav.tsx`
- Modify: `e2e/mobile.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: complete Tasks 1–4 application.
- Produces: automated end-to-end coverage and deployed production evidence.

- [ ] Add failing Playwright checks for the full tab journey, semantic `main`/`nav` structure, one `h1` per screen, 44px visible controls, 320/390/1280 containment, and zero console errors.
- [ ] Run `pnpm exec playwright test` and confirm the new assertions fail before accessibility hardening.
- [ ] Implement landmarks, headings, focus/touch-target fixes, responsive containment, and documentation updates.
- [ ] Run format check, typecheck, unit suite, Playwright suite, token scan, and production build; expect zero failures.
- [ ] Perform a React best-practices review and correct Important/Critical findings with RED→GREEN tests.
- [ ] Commit, push to `main`, verify the Vercel deployment is READY, and repeat the critical production journey at 390px.
- [ ] Commit as `feat: deliver verified field-day cockpit`.

