# Field AI Unified Action Agent

## Scope

- Keep Reign Territory's existing mobile navigation and field flows intact.
- Add typed Field AI messages, cards, tool calls, proposed actions, confirmations, and offline queue behavior.
- Add a Territory-owned server-side gateway boundary for Field AI tools.
- Connect read-only intelligence retrieval to the existing versioned REIGN OSINT rep-brief endpoint.
- Preserve provider secrets on the server and keep the OSINT operator UI independent.
- Add unit, integration, security, and browser coverage for the new behavior.

## Non-goals

- Redesigning Territory's mobile UI or embedding the OSINT UI.
- Adding calendar, email, CRM, Google Sheets, or unrestricted generic MCP execution in v1.
- Replacing the existing route, visit, disposition, follow-up, recovery, Field AI, or summary concepts.

## File boundaries

- Territory `src/`, `api/` or server-function boundary if supported by the deployment setup, `e2e/`, and relevant package/config files.
- Territory tests and documentation directly related to this feature.
- OSINT only where required to stabilize or consume the existing rep-brief contract; no OSINT UI changes.
- Do not modify unrelated deployment, map, or existing field workflow behavior.

## Acceptance criteria

- Field AI accepts text and existing voice input using the same typed message path.
- Read requests can produce account, route, research, and summary cards.
- Every write produces a proposed action and requires explicit confirmation.
- Confirmed actions execute once, use idempotency, and become queued when offline.
- Cancelled actions do not mutate field state.
- Queued actions replay safely after reconnection and retain readable failure state.
- Live OSINT, cached rep brief, and local fixture fallback are source-labeled and freshness-labeled.
- No provider secret appears in the browser bundle.
- Existing Territory mobile navigation and field workflows remain passing.
- Unit, integration, browser, typecheck, build, and diff checks pass.

## Ordered execution plan

1. Add failing tests for typed agent contracts, action lifecycle, cache versioning, and tool authorization.
2. Add the typed contracts and deterministic local tool registry.
3. Move the existing Field AI local response/card behavior behind the gateway interface.
4. Add the server-side message and action confirmation boundary.
5. Add OSINT rep-brief retrieval with cache and fixture fallback.
6. Add offline queue persistence and replay.
7. Connect existing Territory write flows to confirmed actions.
8. Add browser coverage for cards, confirmation, offline queue, and existing workflows.
9. Run typecheck, tests, build, browser verification, and security checks.

## QA commands

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm run test:e2e`
- `git diff --check`
- OSINT `npm test` and `npm run build` when its contract boundary changes.

