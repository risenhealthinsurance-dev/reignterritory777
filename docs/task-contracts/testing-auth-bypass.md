## Scope

Keep authentication bypassed for local development and Vercel Preview deployments while the product is being tested, without weakening the production deployment.

## Non-goals

- Do not bypass authentication on `https://reignterritory777.vercel.app`.
- Do not remove Supabase authentication or magic-link support.
- Do not expose service-role credentials or alter database authorization policies.

## File boundaries

- `src/lib/runtimeConfig.ts`
- `src/lib/runtimeConfig.test.ts`
- `.env.local` (local ignored developer configuration only)
- Vercel Preview environment configuration
- Relevant task contract documentation

## Acceptance criteria

1. Local development opens the app without showing the sign-in screen.
2. Fresh Vercel Preview deployments open the app without showing the sign-in screen.
3. Production remains authentication-gated.
4. Explicit `VITE_AUTH_BYPASS=false` disables the bypass.
5. Automated tests cover the bypass decision and existing auth behavior remains intact.
6. No secret or service-role credential is added to client-visible configuration.

## Ordered execution plan

1. Confirm the existing runtime flag and auth wiring.
2. Configure the explicit testing bypass for local and Preview environments only.
3. Run typecheck and focused auth tests.
4. Deploy a fresh Preview and verify the first authenticated app screen renders without the sign-in form.

## QA commands

- `pnpm typecheck`
- `pnpm vitest run src/lib/runtimeConfig.test.ts src/auth/AuthProvider.test.tsx`
- `git diff --check`
- Fresh Vercel Preview browser verification
