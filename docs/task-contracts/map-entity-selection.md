## Scope

Implement first-class Mapbox building/unit selection for the Reign Territory home map while preserving existing business-marker selection and explicit saved-pin creation.

## Non-goals

- Replacing the Mapbox Standard style.
- Inventing suite geometry when the style does not expose it.
- Changing authentication, live-location, route, territory, pipeline, or camera behavior.

## File boundaries

- `src/components/MapView.tsx`
- `src/components/MapFallback.tsx` only if required for type-compatible selection behavior
- `src/screens/MapGptShell.tsx`
- `src/data/accounts.ts` only if the entity model requires shared types there
- `src/types.ts` only if shared types belong there
- Relevant tests under `src/components/` and `src/screens/`
- `src/index.css` for selected-entity presentation

## Acceptance criteria

1. Existing business marker clicks continue selecting the existing account.
2. Building clicks use a dedicated callback/model, select a stable feature/coordinate entity, visibly outline it, and update assistant context without opening the pin dialog.
3. Mapbox-provided names and unit/suite identifiers are used when available; otherwise the selected context shows an editable business-name-needed label and reverse-geocoded address.
4. Unit selection is separate from parent-building selection when the current style exposes unit geometry; otherwise the limitation is surfaced without fake unit data.
5. Brief, talking points, next action, visit notes, and dispositions use the selected entity ID.
6. Only `＋ Add pin` opens the saved-pin dialog and creates a persisted pin.
7. Typecheck, relevant unit tests, and `git diff --check` pass.
8. A fresh Vercel Preview is deployed and browser-tested for marker selection, named/unnamed building selection, pin-dialog separation, visible selection state, and disposition scoping.

## Ordered execution plan

1. Add a dedicated `MapEntitySelection` model and `onEntitySelect` callback.
2. Query building features in the Mapbox Standard style, prefer stable feature IDs, extract names/units, and maintain a selected highlight layer/source.
3. Replace synthetic pin-like map-click handling with entity context handling and reverse-geocoded address fallback.
4. Add editable selected-entity naming/context UI and preserve account-scoped action IDs.
5. Add focused tests and run typecheck/unit tests.
6. Deploy a fresh Preview and complete browser visual QA.

## QA commands

- `pnpm typecheck`
- `pnpm vitest run src/components/MapView.test.tsx src/screens/MapGptShell.test.tsx`
- `git diff --check`
- Repository Vercel Preview deployment command from README/package configuration
