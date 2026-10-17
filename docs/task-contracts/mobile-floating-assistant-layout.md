# Mobile Floating Assistant Layout Contract

## Scope

Refocus the map experience on mobile viewports. The map remains the primary surface; Reign's floating card defaults to the AI's next recommended action and switches to the selected business when a business is focused. Add a visible, square territory setup flow: freely resize a square, save it permanently, automatically enter fitted sky-view quadrant setup, require quadrant placement and save, then return to normal map navigation.

## Non-goals

- No changes to pipeline data behavior or backend persistence.
- No changes to authentication, backend APIs, or business data.
- No desktop redesign beyond preserving a usable responsive fallback.

## File boundaries

- Modify: `src/screens/MapGptShell.tsx`
- Modify: `src/index.css`
- Modify: `src/components/MapView.tsx` only if selection/close behavior requires it
- Test: `src/screens/MapGptShell.test.tsx`
- Test: `src/components/MapView.test.tsx` only if MapView behavior changes

## Acceptance criteria

- On a mobile viewport, the map fills the available screen without the route/status pill covering the map.
- The saved-territories summary does not overlap the mobile navigation or map controls; territory information is available through a compact drawer/control.
- With no business selected, the floating card shows Reign's next recommended action.
- Selecting a business changes the floating card to that business's context.
- Closing the business card deselects the business and restores the default AI recommendation.
- The floating card has an explicit close control and does not permanently occupy the lower half of the viewport.
- Drawing territory keeps its focused editing controls usable on mobile.
- Drawing starts with a visible resizable square rather than invisible map points.
- Saving the boundary permanently locks a translucent territory square and forces quadrant setup.
- Quadrant setup uses visible numbered squares and a fitted overview camera; saving quadrants returns to normal navigation.
- Locked territory overlays are hidden while the rep is working inside a quadrant so the map remains unobstructed.
- Existing relevant tests, type-checking, and production visual QA pass.

## Ordered execution plan

1. Add failing component tests for default recommendation state, business-focused state, close/reset behavior, and the territory setup state machine.
2. Implement the mobile-first shell and floating card state transitions.
3. Remove obsolete route/status and overlapping saved-territory map overlays while preserving access to territory management.
4. Replace point-only boundary capture with a visible resizable square and forced quadrant setup using the existing map territory layer/camera hooks.
5. Add responsive styling for compact controls, square handles, quadrant setup, card positioning, close affordance, and mobile spacing.
6. Run focused tests, type-check, diff checks, and live browser QA at a mobile viewport.

## QA commands

- `pnpm typecheck`
- `pnpm vitest run src/screens/MapGptShell.test.tsx src/components/MapView.test.tsx --reporter=dot`
- `git diff --check`
- Live browser QA at a mobile viewport against the production deployment.

## Definition of done

The mobile map is visually uncluttered, the assistant card follows the approved default-versus-selected-business behavior, obsolete overlays no longer overlap the map, automated checks pass, and the production flow is manually verified.
