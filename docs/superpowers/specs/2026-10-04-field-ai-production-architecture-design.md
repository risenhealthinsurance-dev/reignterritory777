# Production Field AI Architecture

Date: 2026-10-04
Status: Approved in conversation; implementation remains gated by the task contract
Classification: Mixed feature, architecture, security, and data change

## Product intent

Reign Territory should give a B2B field representative a trustworthy, mobile-first view of businesses, parcels, zoning context, routes, and account-specific AI guidance. The system must work without an existing CRM, distinguish verified facts from inference, retain source provenance, and never imply that zoning alone proves a business exists or is legally permitted.

The first production slice targets Fort Pierce, Florida and preserves the deployed field-day workflow while replacing deterministic Field AI fixtures with authenticated, organization-isolated, source-backed data.

## Selected approach

Use Supabase as the system of record and security boundary:

- Supabase Auth for email magic links.
- Postgres and PostGIS for tenant data, evidence, business locations, parcels, zoning, and route state.
- Row Level Security for organization and representative isolation.
- Supabase Edge Functions as the only OpenAI and enrichment API callers.
- OpenAI Responses API with structured output and `store: false`.
- Official Fort Pierce ArcGIS layers as the first parcel and zoning source.
- OSRM for the initial road-network matrix and route geometry.

This is preferred over a split Vercel/backend architecture because the first release benefits from one identity, database, policy, and function boundary. A browser-only design is rejected because it cannot protect provider secrets or provide authoritative tenancy and audit controls.

## System boundaries

### Browser client

The React/Vite client owns presentation, interaction, local caching, and the offline mutation queue. It uses the Supabase anonymous/publishable key and the signed-in user's JWT. It never receives the Supabase service-role key or OpenAI key.

The current field-day flow remains the shell. Field AI inherits the current route-stop context, can switch accounts or enter territory-wide mode, and exposes explicit loading, empty, cached, queued, error, and review states.

### Supabase

Supabase is authoritative for identity, organization membership, normalized businesses, locations, evidence, enrichment jobs, AI runs, proposed edits, approvals, visits, and queued actions.

All tenant-owned tables carry `organization_id`. Policies derive access through `auth.uid()` and membership rows. Supplying another organization's identifier never grants access. Service-role access is limited to server-side ingestion and administrative jobs.

### Edge Functions

Edge Functions validate the JWT, derive organization and representative identity, validate inputs, load authorized context, and call external services. Functions reject missing or invalid authentication before processing work.

The Field AI function calls the OpenAI Responses API and requires a strict structured response. It stores request metadata, evidence references, output, validation state, latency, and error classification without persisting provider-side response state.

### External sources

The first source registry supports:

- Fort Pierce ArcGIS address points, parcels, current zoning, and future land use.
- Official business websites.
- US Census geocoder and business statistics.
- OpenStreetMap data used within its license and endpoint policies.
- NPPES for healthcare entities.
- GLEIF for legal entities and relationships.
- SEC EDGAR for public-company filings.
- ICANN RDAP for domain-registration evidence.
- Applicable SAM.gov public records.

Google Maps and LinkedIn scraping are excluded. Public Nominatim is not used for recurring bulk production enrichment; a compliant provider or self-hosted service is required if Nominatim-style geocoding becomes necessary.

## Data model

The initial schema contains these bounded concepts:

- `organizations`, `organization_members`, `rep_profiles`
- `territories`, `territory_assignments`
- `businesses`, `business_locations`
- `source_registry`, `source_observations`, `normalized_facts`
- `fact_conflicts`, `proposed_business_changes`, `change_reviews`
- `parcels`, `zoning_districts`, `future_land_use_areas`, `building_footprints`
- `parcel_business_candidates`
- `enrichment_jobs`, `enrichment_attempts`
- `ai_runs`, `ai_citations`, `ai_suggested_actions`
- `field_visits`, `visit_notes`, `route_plans`, `route_stops`
- `sync_mutations`

Raw observations remain immutable except for retention operations. Normalized facts reference their observations. A rep verification produces a new authoritative fact or correction record rather than deleting the prior claim.

Every externally sourced record stores source identity, retrieval time, source URL or dataset identifier, license metadata, raw payload or content hash, parser version, and freshness state. Confidence is a system assessment, not a substitute for provenance.

## Geospatial model and zoning semantics

PostGIS stores WGS84 geometry and creates spatial indexes for account points and polygons. The Fort Pierce importer pages through the official ArcGIS Feature Service and upserts by stable source identifiers and source edit timestamps.

Map overlays classify current zoning into:

1. Business-priority
2. Business-permitted or mixed
3. Conditional — verify allowed use
4. Primarily residential or non-target

Current zoning is the operational layer. Future land use is displayed as informational planning context. Mixed-use, conditional, grandfathered, home-occupation, vacant-parcel, and multi-zone cases remain visibly qualified. The UI never labels an area as definitively “business only” unless the source itself makes that exact determination and the evidence is shown.

Parcel polygons are required for the first release. Building footprints are used where an authoritative or OSM source is available and otherwise omitted without inventing geometry.

## Enrichment and entity resolution

An enrichment request creates an idempotent job. Each connector retrieves and stores a raw observation before normalization. Deterministic matching considers normalized address, verified domain, phone, legal identifier, and coordinate proximity. AI may rank or explain ambiguous candidate matches but cannot silently merge records.

High-confidence, non-conflicting facts can become proposed normalized facts. Conflicts and material profile changes require representative review. Representative-verified corrections have the highest precedence for the organization and remain auditable.

Partial source failure does not erase successful observations. Connector errors are classified as retryable, rate-limited, authorization, malformed response, unavailable, or policy/license blocked. Retryable work uses bounded exponential backoff.

## Field AI contract

The Field AI request contains an account or territory scope, intent, optional rep input, and an idempotency key. The server assembles only authorized evidence and asks OpenAI for a schema-constrained response containing:

- concise answer
- facts with evidence identifiers
- inferences explicitly labeled as such
- uncertainties and missing information
- confidence level and rationale
- suggested actions
- refusal or unavailable state when applicable

The server validates every citation against the supplied evidence set. Unsupported citations or invalid structured output fail closed and return a recoverable error. The UI displays facts, inferences, confidence, freshness, and sources separately.

Suggested follow-ups, profile edits, research jobs, and route changes are drafts. They require explicit review before being queued or applied. The product does not claim to write to a CRM, send outreach, or modify a calendar when no such integration exists.

## Routing and offline behavior

Eligible stops require verified or qualified coordinates. The server obtains an OSRM road-network matrix and route geometry, then optimizes within hard appointments, territory boundaries, rep constraints, and approved stop eligibility. An unsnappable stop is surfaced and excluded from automatic optimization until reviewed.

The client caches the most recent authorized brief, account context, map data needed for the active area, and route. Offline mutations are written with client-generated idempotency keys. Reconnection replays them in order. Server version conflicts stop automatic application and create a review state.

## Security and privacy

- `OPENAI_API_KEY` and Supabase service-role credentials exist only in managed server-side secrets.
- The browser receives only the publishable Supabase configuration.
- RLS is enabled before tenant data is exposed.
- Edge Functions validate authentication and organization membership.
- OpenAI calls use `store: false` and the minimum necessary context.
- Logs redact secrets and avoid raw sensitive prompt payloads.
- Source content is retained only as permitted by its terms and license.
- Audit events cover enrichment, AI generation, approval, correction, and sync application.

## Failure and empty states

The UI distinguishes:

- unauthenticated or expired session
- no organization membership
- no account selected
- no evidence found
- ambiguous business match
- stale source data
- partial enrichment
- source unavailable or rate-limited
- invalid or refused AI response
- provider quota or transient provider failure
- cached offline result
- queued offline action
- sync conflict
- parcel without a business candidate
- business without a usable road-network coordinate

Absence of evidence is rendered as “Not verified,” never filled with a plausible model-generated claim.

## Verification strategy

Database tests prove tenant isolation, representative access, service-only operations, and cross-organization denial. Function tests prove JWT enforcement, input and output schema validation, evidence-scoped citations, provider error mapping, idempotency, and secret non-disclosure. Connector tests use recorded fixtures and cover pagination, freshness, malformed data, and partial failures.

Client tests cover auth states, source presentation, conflicts, approvals, cached results, offline queuing, and preserved field-day flows. End-to-end browser QA uses a seeded organization and representative at 320px and 390px widths, captures accessibility snapshots and screenshots, and inspects console and network failures.

## Rollout

1. Create schema, RLS, auth configuration, and repeatable seed data.
2. Add the authenticated client boundary and repositories while preserving fixture-backed tests.
3. Import Fort Pierce GIS layers and render selectable overlays.
4. Add source registry, enrichment jobs, and initial connectors.
5. Add server-side Field AI with structured, cited responses.
6. Replace straight-line routing with OSRM-backed route proposals.
7. Complete offline queue/conflict behavior and full regression QA.

The first release is complete only when the production path—not merely fixtures—passes the approved acceptance criteria.
