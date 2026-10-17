# Adaptive Field Camera

## Scope

Implement an Apple Maps-style field camera for the Mapbox-backed `MapView`:

- Use an angled 3D Mapbox Standard basemap with visible POI labels and buildings.
- Track browser geolocation when available and render the rep's live position and heading.
- Follow GPS movement heading while moving; use device compass heading when nearly stationary when available.
- Use walking mode below 8 km/h and driving mode above 12 km/h, retaining the prior mode in between to prevent flicker.
- Use a closer building-level camera for walking and a modestly wider aerial camera for driving.
- Allow manual pan, rotate, and zoom to suspend camera following.
- Provide a recenter control that restores live location, heading, pitch, and mode-appropriate zoom.
- Preserve existing route, account-marker, territory, and fallback-map behavior.

## Non-goals

- Turn-by-turn navigation or route recalculation.
- Background location tracking after the page is closed.
- Sending location data to a server or CRM.
- Replacing the existing Mapbox token/search configuration.
- Implementing a native mobile wrapper.

## File boundaries

Allowed to change:

- `src/components/MapView.tsx`
- `src/components/MapView.test.tsx`
- `src/index.css`
- `docs/README.md` or `README.md` only if browser permission behavior needs documentation

## Acceptance criteria

1. With a Mapbox token, the map loads with colored POI labels, 3D buildings, an angled camera, and no forced monochrome styling.
2. A geolocation update with coordinates, speed, and heading moves the rep indicator and updates camera center/bearing when follow mode is active.
3. Walking-speed updates use the closer camera; driving-speed updates use the wider camera; values between thresholds do not rapidly toggle modes.
4. User camera interaction suspends automatic follow and reveals an accessible recenter button.
5. Recenter returns to the latest live position and heading and hides the recenter affordance.
6. Location denial/unavailability leaves the territory usable, keeps the existing Fort Pierce fallback center, and exposes a clear location-unavailable state.
7. Existing fallback rendering and relevant route/marker tests remain passing.
8. Browser QA verifies the visible map, camera controls, responsive layout, and console state in the deployed/local app.

## Ordered execution plan

1. Add failing unit tests for camera policy, geolocation updates, manual override, recenter, and unavailable location state.
2. Implement the smallest camera/location controller inside `MapView`.
3. Restore detailed Mapbox Standard styling and add the rep location/heading affordance and recenter control.
4. Run targeted tests, type-check, build, and diff checks.
5. Run browser UX QA with screenshots and accessibility evidence for default, manual override, recenter, and unavailable-location states.

## QA commands

```text
pnpm test -- src/components/MapView.test.tsx
pnpm run typecheck
pnpm run build
git diff --check
```

