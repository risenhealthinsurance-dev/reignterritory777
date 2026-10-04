create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'rep' check (role in ('rep', 'manager', 'admin')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function private.is_organization_member(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members membership
    where membership.organization_id = candidate
      and membership.user_id = auth.uid()
  );
$$;

create table public.rep_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.territories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  boundary extensions.geometry(MultiPolygon, 4326),
  created_at timestamptz not null default now()
);

create table public.territory_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  territory_id uuid not null references public.territories(id) on delete cascade,
  rep_profile_id uuid not null references public.rep_profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (territory_id, rep_profile_id)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  legal_name text,
  website text,
  status text not null default 'candidate' check (status in ('candidate', 'active', 'closed', 'relocated', 'not_verified')),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  formatted_address text,
  location extensions.geography(Point, 4326),
  coordinate_status text not null default 'unverified' check (coordinate_status in ('unverified', 'qualified', 'verified', 'unsnappable')),
  created_at timestamptz not null default now()
);

create table public.source_registry (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  base_url text,
  license_name text,
  rate_limit_notes text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id, id)
);

create table public.source_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  field_value jsonb not null,
  source_id text not null,
  source_url text,
  source_record_id text,
  retrieved_at timestamptz not null,
  source_updated_at timestamptz,
  license_metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb,
  content_hash text,
  parser_version text,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  foreign key (organization_id, source_id)
    references public.source_registry(organization_id, id)
);

create table public.normalized_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  field_value jsonb not null,
  source_observation_id uuid references public.source_observations(id),
  verified_by_rep_id uuid references public.rep_profiles(id),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  valid_from timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.fact_conflicts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  observation_ids uuid[] not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.proposed_business_changes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  field_name text not null,
  proposed_value jsonb not null,
  evidence_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'superseded')),
  created_at timestamptz not null default now()
);

create table public.change_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  proposed_change_id uuid not null references public.proposed_business_changes(id) on delete cascade,
  reviewer_id uuid not null references public.rep_profiles(id),
  decision text not null check (decision in ('approved', 'rejected')),
  reason text,
  created_at timestamptz not null default now()
);

create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id text not null,
  parcel_number text,
  site_address text,
  acreage numeric,
  geometry extensions.geometry(MultiPolygon, 4326) not null,
  source_updated_at timestamptz,
  retrieved_at timestamptz not null,
  unique (organization_id, source_id)
);

create table public.zoning_districts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id text not null,
  zoning_code text,
  zoning_description text,
  classification text not null check (classification in ('business_priority', 'business_permitted_mixed', 'conditional_verify', 'residential_non_target')),
  geometry extensions.geometry(MultiPolygon, 4326) not null,
  source_updated_at timestamptz,
  retrieved_at timestamptz not null,
  unique (organization_id, source_id)
);

create table public.future_land_use_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id text not null,
  designation text,
  geometry extensions.geometry(MultiPolygon, 4326) not null,
  source_updated_at timestamptz,
  retrieved_at timestamptz not null,
  unique (organization_id, source_id)
);

create table public.building_footprints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id text not null,
  source_name text not null,
  geometry extensions.geometry(MultiPolygon, 4326) not null,
  retrieved_at timestamptz not null,
  unique (organization_id, source_name, source_id)
);

create table public.parcel_business_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parcel_id uuid not null references public.parcels(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  match_confidence numeric(4,3) not null check (match_confidence between 0 and 1),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (parcel_id, business_id)
);

create table public.enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'partial', 'complete', 'failed')),
  requested_by uuid references public.rep_profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id, idempotency_key)
);

create table public.enrichment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.enrichment_jobs(id) on delete cascade,
  source_id text not null,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('success', 'retryable', 'rate_limited', 'unauthorized', 'malformed', 'unavailable', 'policy_blocked')),
  error_code text,
  retry_after timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, source_id, attempt_number)
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rep_profile_id uuid references public.rep_profiles(id),
  business_id uuid references public.businesses(id),
  intent text not null,
  idempotency_key text not null,
  status text not null check (status in ('running', 'complete', 'refused', 'invalid_output', 'provider_error')),
  model text,
  output jsonb,
  latency_ms integer,
  error_code text,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.ai_citations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ai_run_id uuid not null references public.ai_runs(id) on delete cascade,
  source_observation_id uuid not null references public.source_observations(id),
  claim_path text not null,
  created_at timestamptz not null default now()
);

create table public.ai_suggested_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ai_run_id uuid not null references public.ai_runs(id) on delete cascade,
  action_type text not null check (action_type in ('research', 'follow_up', 'profile_edit', 'route_change')),
  payload jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'applied')),
  approved_by uuid references public.rep_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.field_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id),
  rep_profile_id uuid not null references public.rep_profiles(id),
  outcome text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.visit_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_visit_id uuid not null references public.field_visits(id) on delete cascade,
  author_id uuid not null references public.rep_profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.route_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  territory_id uuid not null references public.territories(id),
  rep_profile_id uuid not null references public.rep_profiles(id),
  route_date date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'active', 'complete')),
  geometry extensions.geometry(LineString, 4326),
  created_at timestamptz not null default now()
);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  route_plan_id uuid not null references public.route_plans(id) on delete cascade,
  business_location_id uuid not null references public.business_locations(id),
  stop_order integer not null check (stop_order >= 0),
  hard_appointment_at timestamptz,
  travel_seconds integer,
  status text not null default 'pending',
  unique (route_plan_id, stop_order)
);

create table public.sync_mutations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rep_profile_id uuid not null references public.rep_profiles(id),
  idempotency_key text not null,
  entity_type text not null,
  entity_id uuid,
  base_version bigint,
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'applied', 'conflict', 'rejected')),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique (organization_id, idempotency_key)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid,
  table_name text not null,
  record_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index business_locations_location_gix on public.business_locations using gist (location);
create index territories_boundary_gix on public.territories using gist (boundary);
create index parcels_geometry_gix on public.parcels using gist (geometry);
create index zoning_districts_geometry_gix on public.zoning_districts using gist (geometry);
create index future_land_use_geometry_gix on public.future_land_use_areas using gist (geometry);
create index building_footprints_geometry_gix on public.building_footprints using gist (geometry);
create index source_observations_entity_idx on public.source_observations (organization_id, entity_type, entity_id, field_name, retrieved_at desc);

do $$
declare
  tenant_table text;
begin
  foreach tenant_table in array array[
    'rep_profiles', 'territories', 'territory_assignments', 'businesses', 'business_locations',
    'source_registry', 'source_observations', 'normalized_facts', 'fact_conflicts',
    'proposed_business_changes', 'change_reviews', 'parcels', 'zoning_districts',
    'future_land_use_areas', 'building_footprints', 'parcel_business_candidates',
    'enrichment_jobs', 'enrichment_attempts', 'ai_runs', 'ai_citations',
    'ai_suggested_actions', 'field_visits', 'visit_notes', 'route_plans', 'route_stops',
    'sync_mutations', 'audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', tenant_table);
    execute format(
      'create policy tenant_members on public.%I for all to authenticated using (private.is_organization_member(organization_id)) with check (private.is_organization_member(organization_id))',
      tenant_table
    );
  end loop;
end;
$$;

alter table public.organizations enable row level security;
create policy organization_members_read on public.organizations
for select to authenticated
using (private.is_organization_member(id));

alter table public.organization_members enable row level security;
create policy memberships_read on public.organization_members
for select to authenticated
using (user_id = auth.uid() or private.is_organization_member(organization_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select on public.organizations, public.organization_members to authenticated;

create or replace function private.capture_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_events (organization_id, actor_user_id, table_name, record_id, action, before_data, after_data)
  values (
    (row_data ->> 'organization_id')::uuid,
    auth.uid(),
    tg_table_name,
    row_data ->> 'id',
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_businesses after insert or update or delete on public.businesses
for each row execute function private.capture_audit_event();
create trigger audit_normalized_facts after insert or update or delete on public.normalized_facts
for each row execute function private.capture_audit_event();
create trigger audit_change_reviews after insert or update or delete on public.change_reviews
for each row execute function private.capture_audit_event();
create trigger audit_ai_runs after insert or update or delete on public.ai_runs
for each row execute function private.capture_audit_event();
create trigger audit_sync_mutations after insert or update or delete on public.sync_mutations
for each row execute function private.capture_audit_event();
