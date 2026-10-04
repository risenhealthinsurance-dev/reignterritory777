# Production Field AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the browser-local Field AI prototype with a tenant-safe, source-backed OpenAI and Supabase system for B2B field representatives.

**Architecture:** Supabase Auth, Postgres/PostGIS, RLS, and Edge Functions form the security and persistence boundary. The React client consumes authenticated repositories, renders official Fort Pierce GIS data, and queues idempotent offline work; Edge Functions call OpenAI, public enrichment sources, and OSRM without exposing secrets.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, Supabase JS, PostgreSQL/PostGIS, Supabase Edge Functions/Deno, Zod, OpenAI Responses API, Mapbox GL, ArcGIS Feature Service, OSRM.

**Spec:** `docs/superpowers/specs/2026-10-04-field-ai-production-architecture-design.md`

**Contract:** `docs/task-contracts/field-ai-production.md`

## Global Constraints

- Execute from the isolated worktree created at `origin/main`; never mutate the stale checkout.
- Email magic-link is the only first-release sign-in method.
- Every tenant row carries `organization_id`; access derives from `auth.uid()` membership under RLS.
- OpenAI uses the Responses API, strict structured output, and `store: false` from an authenticated server function only.
- Raw evidence, normalized facts, conflicts, citations, corrections, and approvals stay auditable.
- Current zoning is operational context; future land use is informational; neither proves a business exists or is legally permitted.
- No autonomous CRM, outreach, calendar, profile, or route write occurs without representative approval.
- Public Nominatim, LinkedIn scraping, and Google Maps scraping are prohibited.
- Mobile QA covers 320x844 and 390x844.
- Secrets never enter client bundles, commits, screenshots, logs, or database application rows.

## Review Focus

- A JWT with a user from another organization must return no tenant rows and cannot enqueue a job for a supplied foreign `organization_id`.
- An AI response containing an evidence ID not supplied in the request context must fail closed instead of rendering the claim.
- A parcel intersecting multiple zoning polygons must remain conditional/qualified rather than being promoted to business-priority by one overlap.
- Replaying the same offline idempotency key after an uncertain network failure must create exactly one mutation.
- An ArcGIS page, OSRM route, or source payload containing null/malformed coordinates must preserve partial success and surface the bad record without poisoning the batch.

---

### Task 1: Typed Auth and Runtime Boundary

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`, `.env.example`, `src/main.tsx`, `src/App.tsx`
- Create: `src/lib/runtimeConfig.ts`, `src/lib/supabase.ts`, `src/auth/AuthProvider.tsx`, `src/auth/AuthScreen.tsx`
- Test: `src/lib/runtimeConfig.test.ts`, `src/auth/AuthProvider.test.tsx`

**Interfaces:**

- Produces: `readPublicRuntimeConfig(env): { supabaseUrl: string; supabaseAnonKey: string } | null`
- Produces: `AuthProvider`, `useAuth(): { status; session; signInWithMagicLink; signOut }`
- Produces: `AuthScreen({ onSubmit? })`

- [ ] Write tests proving missing public config yields demo-safe unavailable state, valid config constructs the public client, magic-link submission reports success/error, and protected UI never renders before session resolution.
- [ ] Run `pnpm vitest run src/lib/runtimeConfig.test.ts src/auth/AuthProvider.test.tsx`; expect failures because the modules do not exist.
- [ ] Add `@supabase/supabase-js` and `zod`; implement the exact interfaces with only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` available to browser code.
- [ ] Run the focused tests and `pnpm test`; expect all tests green.
- [ ] Commit with `feat: add tenant authentication boundary`.

### Task 2: PostGIS Schema, RLS, and Seed Data

**Files:**

- Create: `supabase/config.toml`, `supabase/migrations/202610040001_field_ai.sql`, `supabase/seed.sql`, `supabase/tests/field_ai_rls.test.sql`, `src/domain/evidence.ts`, `src/domain/evidence.test.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: organization, membership, territory, business/location, observation/fact/conflict/review, GIS, enrichment, AI, visit, route, and sync tables named by the spec.
- Produces: `resolveFacts(observations, corrections): { facts; conflicts }` where rep-verified corrections outrank source observations without deleting history.

- [ ] Write domain tests for conflicting claims, source timestamps, and representative precedence; write pgTAP tests that set JWT claims for anonymous, same-organization, and foreign-organization users.
- [ ] Run the domain test and database test command; expect missing resolver/schema failures.
- [ ] Implement the normalized TypeScript resolver and one idempotent SQL migration with PostGIS, indexes, grants, RLS policies, audit triggers, and deterministic two-organization seed fixtures.
- [ ] Run `pnpm vitest run src/domain/evidence.test.ts`, `supabase db lint`, and `supabase test db`; expect green when local Supabase tooling is available, otherwise record the exact environment blocker without weakening SQL coverage.
- [ ] Commit with `feat: add field intelligence schema and rls`.

### Task 3: Authenticated Function Core and Public Data Connectors

**Files:**

- Create: `supabase/functions/_shared/auth.ts`, `errors.ts`, `http.ts`, `idempotency.ts`, `sources.ts`, `types.ts`
- Create: `supabase/functions/import-fort-pierce-gis/index.ts`, `supabase/functions/enrich-business/index.ts`
- Create: `supabase/functions/tests/auth.test.ts`, `gis.test.ts`, `enrichment.test.ts`
- Create: `src/domain/zoning.ts`, `src/domain/zoning.test.ts`

**Interfaces:**

- Produces: `requireActor(req, client): Promise<{ userId; organizationId; repId }>`; organization is derived, never trusted from input.
- Produces: `classifyZoning(overlaps): business_priority | business_permitted_mixed | conditional_verify | residential_non_target`.
- Produces connector adapters for Fort Pierce ArcGIS, official sites, Census, OSM, NPPES, GLEIF, SEC EDGAR, ICANN RDAP, and applicable SAM.gov records.

- [ ] Write tests for missing/foreign JWTs, ArcGIS pagination/upserts/null geometry, multi-zone classification, connector provenance, partial failure, rate limiting, and malformed payloads.
- [ ] Run the function/domain tests; expect missing module and behavior failures.
- [ ] Implement shared auth/error/idempotency primitives, the Fort Pierce importer, source registry, raw-observation-first enrichment pipeline, and connector adapters with compliant unavailable states.
- [ ] Run focused tests and the full suite; expect green.
- [ ] Commit with `feat: ingest official gis and enrichment evidence`.

### Task 4: Evidence-Bounded OpenAI Field AI

**Files:**

- Create: `supabase/functions/field-ai/index.ts`, `supabase/functions/_shared/fieldAiSchema.ts`, `supabase/functions/tests/field-ai.test.ts`
- Create: `src/lib/fieldAi.ts`, `src/lib/fieldAi.test.ts`
- Modify: `src/screens/FieldAIScreen.tsx`, `src/screens/FieldAIScreen.test.tsx`

**Interfaces:**

- Produces: `FieldAiRequest { scope, intent, repInput?, idempotencyKey }`.
- Produces: `FieldAiResult { answer, facts, inferences, uncertainties, confidence, suggestedActions, status }`; every fact contains authorized evidence IDs.
- Consumes: Task 1 session, Task 2 evidence model, Task 3 authenticated function primitives.

- [ ] Write tests for authenticated request construction, `store: false`, strict schema, authorized citations, unsupported citation rejection, refusal, invalid output, quota/transient errors, and UI fact/inference/source separation.
- [ ] Run the focused tests; expect failures because the production API and UI states are absent.
- [ ] Implement the server OpenAI request/validation and client repository; replace deterministic answer generation while preserving account context, drafts, cached state, and approval semantics.
- [ ] Run focused tests and `pnpm test`; expect green.
- [ ] Commit with `feat: connect field ai to cited openai responses`.

### Task 5: Map Overlays, Road Routing, and Offline Replay

**Files:**

- Create: `src/lib/gis.ts`, `src/lib/gis.test.ts`, `src/lib/offlineQueue.ts`, `src/lib/offlineQueue.test.ts`
- Create: `supabase/functions/plan-route/index.ts`, `supabase/functions/tests/plan-route.test.ts`
- Modify: `src/components/MapView.tsx`, `src/components/MapView.test.tsx`, `src/screens/FieldAIScreen.tsx`, `src/domain/repDay.ts`, `src/domain/repDay.test.ts`

**Interfaces:**

- Produces: selectable GeoJSON parcel/zoning/future-land-use layers with the four zoning classes.
- Produces: OSRM-backed `RouteProposal` with road geometry, duration matrix, constraints, and unsnappable-stop review state.
- Produces: `OfflineMutationQueue.enqueue/replay` with idempotency keys and version-conflict results.

- [ ] Write tests for source-qualified overlays, mobile layer interaction, OSRM matrix use, hard appointments, malformed/null coordinates, unsnappable stops, single-application replay, and version conflicts.
- [ ] Run the focused tests; expect failures because overlays, road routing, and durable replay are absent.
- [ ] Implement GIS repositories/layers, OSRM function/client integration, and IndexedDB/local-storage queue abstraction with visible cached/queued/conflict states.
- [ ] Run focused tests and `pnpm test`; expect green.
- [ ] Commit with `feat: add zoning overlays road routing and offline replay`.

### Task 6: Service Configuration, Deployment, and Full QA

**Files:**

- Modify: `README.md`, `.env.example`, `e2e/mobile.spec.ts`, `playwright.config.ts`
- Create: `docs/architecture/field-ai.md`, `docs/operations/field-ai.md`
- Create: `output/playwright/field-ai-production/**`

**Interfaces:**

- Consumes all prior task interfaces.
- Produces a configured Supabase project, deployed functions, configured magic-link origins, server secrets, deployed client configuration, and QA evidence bundle.

- [ ] Extend Playwright coverage for magic-link test session/bootstrap, real seeded account context, zoning selection, cited AI result, proposed-action approval, route proposal, offline queue, and sign-out at 320x844 and 390x844.
- [ ] Run the new E2E test before final environment wiring; expect a specific missing-service/configuration failure.
- [ ] Use authenticated Supabase UI/CLI access to create or select the project, apply migrations/seeds, set `OPENAI_API_KEY` as a function secret, configure Auth redirect URLs, deploy functions, and set only publishable client environment variables in Vercel.
- [ ] Document source licenses/rate limits, rotation/recovery, migrations, deployment, and provider failure procedures.
- [ ] Run `pnpm typecheck`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, Supabase lint/tests, and `git diff --check`; preserve exact results.
- [ ] Capture accessibility snapshots, screenshots, console/network evidence, and traces for failures under `output/playwright/field-ai-production/`.
- [ ] Commit with `test: verify production field ai workflow`.
