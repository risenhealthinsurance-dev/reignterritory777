# Task Contract: Business-Scoped AI Actions and Callback-Aware Routing

## Scope

- Add business-scoped quick actions to the stop workflow for common reversible dispositions.
- Extend follow-up scheduling with callback-window versus hard-appointment intent.
- Persist the schedule intent on the local `RepDay` state and protect hard appointments in route previews.
- Add a deterministic route suggestion helper that prioritizes hard appointments, then callback windows, then the existing route order.
- Add a repository-local Regrid MCP configuration template that reads `REGRID_TOKEN` from the environment; do not store the provided token in tracked files.

## Non-goals

- No external calendar, CRM, email, SMS, or Regrid data writes in this slice.
- No autonomous route application; route changes remain preview-and-approve.
- No production Regrid ingestion or browser-side Regrid calls.

## File boundaries

- `src/types.ts`
- `src/domain/repDay.ts`
- `src/domain/repDay.test.ts`
- `src/screens/StopScreen.tsx`
- `src/screens/FollowUpScreen.tsx`
- `src/index.css`
- `src/App.tsx`
- `src/App.route-flows.test.tsx`
- `.mcp.json`
- `.env.example`
- `docs/operations/regrid-mcp.md`

## Acceptance criteria

- A stop exposes one-tap reversible disposition actions that update the local stop and return to the route.
- A follow-up can be saved as either a flexible callback window or a hard appointment.
- Saved schedule intent is visible in the stop state and marks local synchronization state.
- Route preview warns when a hard appointment is moved and route suggestion ordering preserves hard appointments before callback windows.
- Existing disposition, follow-up, route, and recovery tests continue to pass.
- `.mcp.json` references `${REGRID_TOKEN}` and the Regrid MCP endpoint without containing a credential.

## Ordered execution plan

1. Add failing domain and component tests for schedule intent, route ordering, and quick actions.
2. Implement the typed local state and UI behavior.
3. Add the safe MCP configuration template and environment documentation.
4. Run typecheck, targeted tests, full tests, build, and diff checks.

## QA commands

```text
pnpm test
pnpm run typecheck
pnpm run build
git diff --check
```
