# Task Contract: Production Field AI

Date: 2026-10-04
Status: Awaiting `PLAN APPROVED`
Classification: Mixed feature, architecture, security, and data change
Design: `docs/superpowers/specs/2026-10-04-field-ai-production-architecture-design.md`

## Scope

Implement the approved production Field AI architecture on an isolated worktree created from `origin/main` (currently the deployed-code baseline), not from the stale local `main` checkout.

The deliverable includes:

- Supabase email magic-link authentication.
- Organization and representative membership with tenant-safe RLS.
- Postgres/PostGIS schema, migrations, policies, deterministic seed data, and database tests.
- Authenticated Edge Functions for enrichment, Fort Pierce GIS ingestion, Field AI, and route planning.
- Server-only OpenAI Responses API integration using structured output and `store: false`.
- Source observations, normalized facts, conflicts, citations, suggested changes, approval records, and auditability.
- Fort Pierce official address, parcel, current-zoning, and future-land-use ingestion and map overlays.
- Source-first business enrichment with the approved public/open source registry.
- OSRM-backed travel matrix and route proposals.
- Mobile Field AI UI connected to real authenticated services with source, confidence, freshness, ambiguity, review, offline, and error states.
- Repeatable demo organization/representative/accounts for automated and visual QA.
- Service configuration through Supabase and deployment environment secrets after local implementation is ready.

## Non-goals

- A live CRM integration or claims that records were written to a CRM.
- Autonomous email, SMS, calendar, profile, or route changes without representative approval.
- Scraping LinkedIn or Google Maps.
- Paid data providers.
- Guaranteed live traffic or traffic-aware ETAs.
- Treating zoning as proof of an operating business, permitted use, or legal compliance.
- Legal zoning determinations.
- Bulk production use of the public Nominatim endpoint.
- Broad redesigns unrelated to Field AI, mapping, enrichment, auth, routing, or the necessary shared data boundary.

## File boundaries

Phase 3 may add or change only these repository paths, plus generated lockfile entries required by approved dependencies:

- `package.json`
- `pnpm-lock.yaml`
- `.env.example`
- `README.md`
- `vite.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `src/App.tsx`
- `src/main.tsx`
- `src/types.ts`
- `src/index.css`
- `src/components/**`
- `src/domain/**`
- `src/lib/**`
- `src/screens/**`
- `src/test/**`
- `src/data/**` only for migration-compatible seed/fixture adapters; production reads must not depend on fixture truth
- `src/**/*.test.ts`
- `src/**/*.test.tsx`
- `e2e/**`
- `supabase/config.toml`
- `supabase/migrations/**`
- `supabase/seed.sql`
- `supabase/tests/**`
- `supabase/functions/_shared/**`
- `supabase/functions/field-ai/**`
- `supabase/functions/enrich-business/**`
- `supabase/functions/import-fort-pierce-gis/**`
- `supabase/functions/plan-route/**`
- `docs/architecture/**`
- `docs/operations/**`
- `docs/task-contracts/field-ai-production.md`
- `docs/superpowers/specs/2026-10-04-field-ai-production-architecture-design.md`
- `output/playwright/field-ai-production/**`

No unrelated file may change. If implementation proves another path is necessary, execution stops and this contract must be amended and approved again.

Local `.env.local` and managed provider secrets may be updated but must remain ignored and must never enter a diff, log, screenshot, browser-visible payload, test fixture, or database row.

## Observable acceptance criteria

### Authentication and tenant isolation

- Given an unauthenticated browser, when a protected screen or function is requested, then the user is directed to email magic-link sign-in or receives an authorization error without protected data.
- Given a valid magic link for a seeded representative, when sign-in completes, then the user reaches their assigned territory and session refresh works.
- Given representatives in two organizations, when either queries or mutates tenant-owned tables, then RLS allows only authorized organization rows and automated policy tests prove cross-organization denial.
- Given a missing, expired, or invalid JWT, when an Edge Function is invoked, then it returns a stable unauthorized response before external API work.

### Provenance and enrichment

- Given a business enrichment job, when an approved source succeeds, then its raw observation and normalized facts retain source identity, URL/dataset ID, retrieval timestamp, license metadata, freshness, and confidence.
- Given conflicting claims, when normalization runs, then both claims remain auditable and the conflict is shown for review rather than silently resolved.
- Given a material change or ambiguous entity match, when enrichment completes, then it remains proposed until a representative approves or rejects it.
- Given a representative correction, when future enrichment runs, then the correction remains highest-precedence organization truth unless explicitly superseded through review.
- Given no supporting source, when a requested fact is absent, then the product says “Not verified” and does not invent a value.
- Given a retryable source failure, when the job runs, then successful source results remain stored and the failed attempt records bounded retry state.

### Parcels and zoning

- Given the Fort Pierce importer, when it processes the official Feature Service, then address points, parcels, current zoning, and future land use are paginated, upserted by stable source identifiers, timestamped, and stored with polygon geometry where provided.
- Given the territory map, when zoning is enabled, then parcel/zoning boundaries are selectable and the four approved classifications are visually distinct at 320px and 390px widths.
- Given current zoning and future land use, when both are displayed, then current zoning is identified as operational context and future land use as informational.
- Given mixed, conditional, multi-zone, vacant, grandfathered, home-occupation, or missing-footprint cases, then the UI displays a qualification and never asserts “business only” without explicit source evidence.

### Field AI

- Given an authenticated account or territory context, when a Field AI action runs, then an authenticated Edge Function calls OpenAI with server-side secrets, `store: false`, minimum authorized evidence, and a strict output schema.
- Given a successful response, then the UI separately renders facts, inferences, uncertainty, confidence, freshness, and citations that resolve to supplied evidence.
- Given an unsupported citation, invalid structure, refusal, provider quota error, or transient provider failure, then the server fails safely and the UI presents a recoverable, non-fabricated state.
- Given a suggested follow-up, profile edit, deeper research action, or route change, then it is a draft and nothing is applied until explicitly approved.
- Given no CRM, mail, or calendar integration, then UI copy never claims external records or messages were written or sent.

### Routing and offline behavior

- Given verified stop coordinates, when a route is planned, then travel costs and geometry come from a road-network service rather than straight-line distance, and hard appointments and rep constraints are preserved.
- Given an unsnappable or ambiguous location, when planning runs, then the stop is flagged for review and not silently routed to a guessed point.
- Given lost connectivity, when a previously loaded account is opened, then the last authorized cached brief and relevant map/route context remain readable and visibly dated.
- Given an offline approved mutation, when it is queued and connectivity returns, then it replays once using an idempotency key; a server-version conflict becomes a review state rather than overwriting data.

### Security and regression

- The OpenAI key and Supabase privileged credentials are never bundled into client assets, stored in database application rows, or committed.
- The browser uses only publishable Supabase configuration and an authenticated session.
- Logs and error messages do not reveal secrets or full sensitive prompt payloads.
- Current route, stop, disposition, recovery, follow-up, summary, and closeout workflows continue to pass their relevant tests.
- The production UI has no unexplained console errors, failed first-party network requests, clipped primary controls, or inaccessible critical interactions in required mobile QA flows.

## Required tests

- SQL/RLS policy tests for anonymous, representative, cross-organization, and service-only operations. If the final schema defines a manager or administrator role, that role must have explicit allow-and-deny policy coverage as well.
- Edge Function unit/integration tests for JWT validation, tenant derivation, input validation, output-schema validation, citation validation, idempotency, provider failures, and redaction.
- Connector fixture tests for Fort Pierce pagination/upsert/freshness and each shipped enrichment connector's normalization/error behavior.
- Domain tests for fact precedence, conflict creation, zoning classification, route constraints, and offline replay/conflicts.
- React tests for auth, loading/empty/error/cached states, evidence rendering, review actions, zoning interaction, and regressions in the existing field-day workflow.
- Playwright end-to-end flow using seeded accounts at 320x844 and 390x844.

## Ordered execution plan

1. Create and attach an isolated worktree from `origin/main`; confirm it matches the deployed baseline and preserve unrelated local files.
2. Add red tests for tenancy, provenance, Field AI output, GIS classification, offline replay, and the representative browser flow.
3. Add approved dependencies and a typed environment boundary that prevents privileged secrets from entering client code.
4. Add Supabase configuration, schema migrations, PostGIS indexes, RLS policies, seed data, and SQL policy tests.
5. Add the Supabase browser client, email magic-link screens/session boundary, authorized repositories, and explicit auth/error states.
6. Add shared Edge Function authentication, validation, source registry, audit, idempotency, retry, and error primitives.
7. Implement the Fort Pierce GIS importer and map repositories; render selectable parcel, zoning, and future-land-use overlays with qualified classifications.
8. Implement source observations, normalized facts, conflict detection, proposed changes, review UI, and connectors for official business websites, Census/geocoder, OSM, NPPES, GLEIF, SEC EDGAR, ICANN RDAP, and applicable SAM.gov public records. A connector may ship as explicitly unavailable only when implementation-time evidence shows that access, licensing, or a required public endpoint prevents compliant use; that condition must have a test, user-visible status, and QA-report entry rather than a silent omission.
9. Implement the OpenAI Field AI function with structured output, `store: false`, evidence-bounded citations, safe failure mapping, and client integration.
10. Implement OSRM matrix/geometry routing, route constraints, ambiguous-location handling, and route proposal review.
11. Implement cached reads, idempotent offline mutation replay, and conflict review without weakening tenant isolation.
12. Configure the Supabase project, Auth magic-link settings, migrations, Edge Function secrets/deployments, and permitted application origins using Computer only where an authenticated UI action is necessary.
13. Configure deployment environment variables without exposing secret values; deploy the approved baseline if the repository's existing deployment path is available.
14. Run the complete QA matrix, diagnose and repair failures within this contract, and produce the evidence bundle and architecture/operations documentation.

## QA commands

Commands may be extended when newly introduced tooling documents an additional check, but none below may be skipped without reporting a blocker:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```

Supabase checks, using the repository-defined commands or Supabase CLI equivalents introduced during implementation:

```powershell
supabase db lint
supabase test db
supabase functions serve --env-file .env.local
```

Visual QA must record the local/deployed URL, browser, viewport, user/seed context, accessibility snapshots, screenshots, console results, network results, and a trace for any suspicious or failing interaction. Artifacts go under `output/playwright/field-ai-production/`.

## Execution and approval gates

- No Phase 3 implementation or external Supabase configuration begins before the user sends the exact phrase `PLAN APPROVED` after reviewing this contract.
- A changed requirement or necessary file outside the boundary reopens this contract.
- Implementation and QA do not authorize merge or integration.
- After the QA report, the exact phrase `MERGE APPROVED` is required for the post-QA merge checkpoint.

## Residual risks to verify during execution

- Actual Supabase account access and project creation remain external prerequisites.
- Source endpoint schemas, licenses, rate limits, and availability can change and must be revalidated at implementation time.
- Free routing infrastructure may require self-hosting or a compliant hosted endpoint for production volume.
- Some source connectors may not return useful records for every business; missing data must stay explicit.
- The local checkout is behind `origin/main`; execution must not accidentally implement against stale files.
