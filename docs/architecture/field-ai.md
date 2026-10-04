# Field AI production architecture

The browser is an authenticated, mobile-first client. Supabase Auth issues the email magic-link session; Postgres/PostGIS and RLS are the tenant boundary; Edge Functions validate the JWT and derive organization membership before reading or mutating data.

Field AI calls OpenAI Responses API only from the `field-ai` Edge Function. Requests use structured JSON Schema output and `store: false`. The function supplies only evidence authorized for the representative's organization, validates every returned citation against that evidence set, and stores the run, citations, and draft actions for audit. Provider keys and Supabase service-role credentials are server-side secrets.

Evidence is append-oriented: raw source observations retain URL or dataset identity, retrieval time, license metadata, and confidence. Normalized facts, conflicts, corrections, and approvals are separate records. The UI labels facts, inferences, uncertainty, and source freshness independently; unsupported claims are rendered as “Not verified.”

Fort Pierce's official ArcGIS address, parcel, current-zoning, and future-land-use layers are imported into PostGIS. Current zoning is operational context; future land use is informational. Overlay classifications are business-priority, business-permitted/mixed, conditional—verify, and primarily residential/non-target. None of these categories is a legal determination or proof that a business operates there.

OSRM provides the initial road-network geometry and durations. Unsnappable or ambiguous coordinates are review states. Offline mutations carry an idempotency key and replay once after reconnect; version conflicts do not overwrite newer server data.

## Environment variables

Client-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- optional `VITE_MAPBOX_ACCESS_TOKEN`

Server-only Supabase secrets:

- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`
- any future connector credentials, never a `VITE_` variable

## Data flow

1. The client submits an intent and account/territory scope with an idempotency key.
2. The function validates the JWT and derives the organization and representative.
3. RLS-scoped evidence is loaded and passed to the structured OpenAI request.
4. The validated result is stored with citations and draft actions.
5. The client renders the result and requires representative approval before queueing an action.
