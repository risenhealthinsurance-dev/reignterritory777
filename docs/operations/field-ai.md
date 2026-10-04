# Field AI operations runbook

## Local setup

Copy `.env.example` to an ignored `.env.local` and fill only publishable Supabase values in the browser section. Never place `OPENAI_API_KEY` in `.env.local` when it will be bundled or committed. Use Supabase managed secrets for deployed Edge Functions.

Install with `pnpm install --frozen-lockfile`, then run `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`.

## Supabase deployment

Apply migrations and seed data through an authenticated Supabase CLI or dashboard session. Configure Auth email magic-link redirect origins for the deployed client and local preview. Deploy `field-ai`, `enrich-business`, `import-fort-pierce-gis`, and `plan-route` only after migration/RLS tests pass. Set `OPENAI_API_KEY` with the project secret manager; verify the value never appears in client assets, logs, or application rows.

## Source operations

Record source URLs/dataset identifiers, licenses, retrieval timestamps, and rate-limit notes. Keep ArcGIS imports paginated and idempotent. Treat stale or unavailable sources as partial results. Do not bulk-use public Nominatim, scrape LinkedIn, or scrape Google Maps.

## Provider failures

- `401/403`: check the managed secret and project permissions without logging the key.
- `429`: surface quota/rate-limit state, preserve prior evidence, and retry only with bounded backoff.
- `5xx` or network timeout: retain the audit record as recoverable and show the cached result if present.
- invalid structured output or unsupported citation: fail closed and do not render a generated claim.

## Rotation and recovery

Rotate the OpenAI key in the provider dashboard, update the Supabase function secret, run a non-sensitive health check, and revoke the old key after the new deployment is verified. If a source schema changes, disable that connector, preserve prior observations, and ship a parser update with fixture coverage.

## Current environment limitation

The Supabase project `iradajkukqlxmzcouybk` was restored through the authenticated Supabase Management API and is now `ACTIVE_HEALTHY`. The four Edge Functions are deployed with API bundling, and `OPENAI_API_KEY` is configured as a managed function secret without logging its value.

The migration API rejected the production migration because this project already contains a legacy `public.territories` table with an incompatible schema (`varchar` IDs and legacy columns). The migration was intentionally not forced: do not drop, rename, or overwrite that table until the owner chooses a compatibility plan. The remaining safe next step is an explicit schema decision (preserve legacy data and introduce a versioned field-territory table, or authorize a reviewed migration of the legacy table). Local typecheck, unit tests, build, and unauthenticated E2E remain passing; authenticated E2E and remote RLS verification remain gated on that schema decision.
