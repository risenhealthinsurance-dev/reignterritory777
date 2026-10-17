# MapGPT-Inspired Mobile Field Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Recompose Reign Territory’s mobile territory and route screens around a full-bleed map, floating next-business card, and bottom field-action sheet inspired by MapGPT.

**Architecture:** Keep the existing App state machine, route planning, stop confirmation, and Field AI behavior. Add a focused map cockpit presentation layer with reusable next-business and assistant action components, then use shared CSS tokens for the mobile and desktop variants.

**Tech Stack:** React, TypeScript, Vite, Mapbox GL JS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-mapgpt-mobile-field-cockpit-design.md`

## Global Constraints

- Preserve appointment/callback scheduling, dispositions, route-proposal protection, Field AI scoping, and offline/local behavior.
- Keep Regrid credentials server-side; do not add `VITE_REGRID_*` variables.
- Do not use Mapbox branding or vehicle/EV copy in the Reign UI.
- Keep all primary mobile actions at least 44px tall.
- Keep the fallback map usable when `VITE_MAPBOX_ACCESS_TOKEN` is absent.

## Review Focus

- Long business names and addresses must wrap without clipping the Navigate action.
- Empty, active, completed, callback, and hard-appointment route states must use distinct markers and labels.
- The bottom sheet must not cover route controls or the primary business card at 390px wide.
- Fallback-map mode must retain the same cockpit hierarchy without pretending it is live geography.
- Reduced-motion mode must remove nonessential glow/slide animation without hiding state.

### Task 1: Add the cockpit presentation components

**Files:**
- Create: `src/components/NextBusinessCard.tsx`
- Create: `src/components/FieldActionSheet.tsx`
- Modify: `src/components/MapView.tsx`
- Modify: `src/components/MapFallback.tsx`

**Interfaces:**
- `NextBusinessCard` consumes an `Account`, optional `DayStop`, and `onNavigate` callback.
- `FieldActionSheet` consumes the active account and `onCall`, `onSchedule`, and `onDisposition` callbacks.
- `MapView` and `MapFallback` render the new overlays while preserving existing marker callbacks.

- [ ] Write component tests for the card’s appointment/callback labels and the action sheet’s accessible buttons.
- [ ] Run the focused component tests and confirm they fail before implementation.
- [ ] Implement the components with semantic buttons, explicit labels, and safe long-text wrapping.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Connect the action sheet to the current workflows

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/MapView.tsx`
- Modify: `src/components/MapFallback.tsx`

**Interfaces:**
- Map actions call the existing `setScreen`, `onPinTap`, and stop/follow-up handlers rather than creating a second state model.

- [ ] Add a test that tapping Schedule from the map opens the selected business’s follow-up flow.
- [ ] Add a test that tapping Disposition from the map opens the selected business’s visit/disposition flow.
- [ ] Implement the wiring with the currently active or recommended stop as the action scope.
- [ ] Run route-flow and component tests.

### Task 3: Implement the visual system and responsive layout

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/MapView.tsx`
- Modify: `src/components/MapFallback.tsx`
- Modify: `src/screens/RouteScreen.tsx`

- [ ] Add shared cockpit tokens for the dark map, glass surfaces, blue route, cyan support color, borders, radii, spacing, and reduced-motion behavior.
- [ ] Recompose the map viewport so the card and sheet are overlays rather than separate dashboard blocks.
- [ ] Keep route editing and end-of-day controls reachable below the sheet or in the existing route screen flow.
- [ ] Verify at 390px and desktop widths; repair clipping and overflow.

### Task 4: Verify the full mobile flow

**Files:**
- Modify: `e2e/mobile.spec.ts` if selectors need stabilization.
- Create: `output/playwright/mapgpt-mobile/` screenshots only during QA.

- [ ] Run the full Vitest suite and production build.
- [ ] Run the app with auth bypass and verify Territory → map action → Schedule/Disposition → Route.
- [ ] Capture mobile screenshots of territory and route states.
- [ ] Compare the implementation against the accepted concept and reference for map hierarchy, card anatomy, action sheet, palette, typography, spacing, and responsive behavior.
- [ ] Remove temporary QA artifacts not needed for the repository handoff.

