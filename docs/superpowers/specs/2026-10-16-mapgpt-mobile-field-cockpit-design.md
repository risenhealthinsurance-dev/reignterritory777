# MapGPT-Inspired Mobile Field Cockpit Design

## Intent

Make Reign Territory feel like a location-intelligent field-sales copilot on a phone. The map is the primary workspace; the app should immediately expose the next best business, route context, and the shortest path to a revenue action.

## Reference direction

The accepted visual direction is the supplied Mapbox MapGPT mobile reference and the generated Reign concept at `C:\Users\USUARIO\.codex\generated_images\01a1476b-1c86-79a3-947f-be4379d5089f\exec-97eb7679-1d0b-496e-9460-41a84f079a67.png`.

Use the interaction pattern, not Mapbox branding or vehicle-specific content:

- Full-bleed, dark live map with a luminous blue route.
- Floating dark-glass next-business card with one dominant blue action.
- Compact map markers with appointment/callback labels.
- Bottom assistant sheet with three field-rep actions.
- Minimal chrome and strong mobile hierarchy.

## Goals

- Make the next best action obvious within one glance.
- Keep route context visible while the rep acts on a business.
- Make Call, Schedule, and Disposition reachable without navigating away from the map.
- Preserve current appointment, callback, disposition, Field AI, offline, and route-protection behavior.
- Use real Mapbox geometry when configured and retain an intentional fallback when it is not.

## Non-goals

- Reproducing Mapbox logos, assistant artwork, vehicle controls, or EV-specific copy.
- Replacing the existing route and stop state model.
- Adding external calendar, CRM, SMS, or calling integrations in this pass.
- Making Regrid parcel overlays part of the visual redesign; that remains a separate provider integration.

## Mobile composition

### Territory and route map surface

- The map occupies the first viewport beneath the safe-area inset.
- Top-left status is a small dark translucent route/territory label.
- Map markers use semantic colors: blue for scheduled, cyan for canvass, green for completed, and a blue halo for the active business.
- Route geometry is electric blue with a soft glow and remains visually subordinate to the next-business card.

### Next-business card

- Floating dark navy surface with a thin blue edge, 16px radius, and restrained shadow.
- Header: `NEXT BEST BUSINESS` and overflow control.
- Business identity, address, appointment/callback time, and estimated arrival.
- Primary action: `Navigate`.
- The card is positioned above the map, not in a separate dashboard section.

### Assistant action sheet

- Docked to the bottom edge with a small drag handle.
- Assistant orb/control sits at the sheet boundary.
- Prompt: `How can I help on this stop?`
- Three equal actions: `Call`, `Schedule`, `Disposition`.
- Existing stop screens remain the confirmation surface after an action is selected.

## Design tokens

- Background: `#050914` / `#081426`.
- Glass surface: `rgba(6, 13, 27, .9)`.
- Primary blue: `#1677ff`.
- Cyan support: `#13c7f3`.
- Text: `#f7fbff`; muted text: `#91a7c8`.
- Border: `rgba(60, 145, 255, .36)`.
- Radius: 16px for floating cards, 14px for controls, 999px for markers.
- Motion: 180ms ease-out for sheet/card state changes; honor reduced motion.

## Responsive behavior

- At mobile widths, map controls never overlap the next-business card or bottom sheet.
- At desktop widths, preserve the mobile information hierarchy but cap the cockpit column and allow more map area.
- Action buttons remain at least 44px tall.
- Long business names wrap inside the card without pushing the primary action off-screen.

## Accessibility

- Map markers retain accessible business-name labels.
- Every action has an explicit text label; icon-only controls have an accessible name.
- Focus states remain visible against dark surfaces.
- Reduced-motion users receive no animated glow or transition dependency.

