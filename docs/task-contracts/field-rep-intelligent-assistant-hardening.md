# Field-rep intelligent assistant hardening

## Scope

Harden the current MapGPT field-rep flow so a rep can move from map/location context to a conversational answer and a pipeline-aware next action. Implement the fixes identified by the QA pass in this order:

1. Make the current MapGPT shell the authoritative browser journey and align E2E coverage with it.
2. Expose live-location permission, availability, freshness, and accuracy state to the rep and assistant context.
3. Use one canonical pipeline context for the Pipeline screen and assistant requests.
4. Preserve a useful multi-turn conversation window and make assistant context visible without clipping.
5. Fix the mobile action-chip layout and verify the primary 390px field-rep viewport.
6. Document the deployment/access requirement discovered in QA and verify the available Vercel preview when it is reachable.

## Non-goals

- Do not bypass authentication in production.
- Do not invent CRM/calendar integrations or claim that local queued actions were externally saved.
- Do not replace the current MapGPT shell with the legacy field-day shell.
- Do not change unrelated legacy route/disposition flows except where shared state contracts require it.

## File boundaries

Allowed to change:

- `src/screens/MapGptShell.tsx`
- `src/components/MapView.tsx`
- `src/components/MapView.test.tsx`
- `src/contracts/mapGpt.ts`
- `src/lib/*` only for shared assistant/pipeline/location context helpers and tests
- `src/index.css`
- `e2e/*`
- `README.md`
- `docs/task-contracts/field-rep-intelligent-assistant-hardening.md`

Do not modify existing unrelated user changes outside these boundaries.

## Acceptance criteria

- The browser journey starts at the current MapGPT Home surface and no longer asserts obsolete legacy headings.
- At 320px, 390px, and 1280px there is no horizontal overflow and all primary controls remain usable.
- Location state is visibly distinguishable as pending, available, denied/unavailable, or stale; accuracy is shown when available.
- The assistant request receives the same canonical pipeline stages shown by the Pipeline screen.
- The assistant keeps enough conversation history for a multi-turn follow-up and renders the active context clearly.
- Action chips do not clip at the 390px viewport.
- Relevant unit/component tests, typecheck, build, formatting, diff check, and E2E checks pass.
- The available Vercel preview is checked after implementation; inaccessible deployment/auth remains explicitly reported.

## Ordered execution plan

1. Add/adjust tests for current shell E2E, location states, canonical pipeline context, multi-turn history, and mobile layout.
2. Implement the smallest code changes to satisfy those tests.
3. Run unit tests, typecheck, build, format check, diff check, and Playwright E2E.
4. Run headed/browser QA against the local app and the Vercel preview if access is available.
5. Report remaining deployment blockers and residual risks.

## QA commands

```text
pnpm test
pnpm run typecheck
pnpm run build
pnpm run format:check
git diff --check
pnpm run test:e2e
```
