# Release Green Deployment Contract

## Scope

Restore the intended browser-local Reign Territory prototype deployment and make the repository's release validation reliable.

## Non-goals

- Do not add production authentication or backend services.
- Do not change the documented prototype product boundary.
- Do not delete unrelated user files or data.

## File boundaries

- `vitest.config.ts`
- `package.json` and `pnpm-lock.yaml` only if required by the fix
- Vercel/deployment configuration discovered during investigation
- Focused regression tests and directly affected application files
- This contract file

## Acceptance criteria

1. The deployed root URL renders the kickoff screen rather than an authentication gate.
2. `pnpm test` exits successfully.
3. `pnpm typecheck` exits successfully.
4. `pnpm build` exits successfully.
5. `pnpm format:check` exits successfully.
6. `pnpm run test:e2e` exits successfully, or any external environment limitation is explicitly isolated.
7. `git diff --check` exits successfully.
8. The final Vercel deployment is verified as ready/green.
9. The deployed critical flow is manually verified.

## Ordered execution plan

1. Inspect Vercel project linkage, deployment source, and current configuration.
2. Reproduce the deployment mismatch from the current repository build.
3. Add or update a focused regression test for the intended unauthenticated prototype entry.
4. Fix the test-runner memory failure with the smallest configuration change.
5. Run all quality gates and repair failures within scope.
6. Deploy through Vercel and verify the production URL.

## QA commands

```text
pnpm test
pnpm typecheck
pnpm build
pnpm format:check
pnpm run test:e2e
git diff --check
```
