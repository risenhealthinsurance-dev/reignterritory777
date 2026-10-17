create or replace function private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
  order by created_at
  limit 1;
$$;

create table public.agent_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_organization_id() references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  assistant_label text not null default 'Ask Reign',
  instructions text not null default '',
  avatar text not null default 'orb' check (avatar in ('orb', 'guide', 'scout')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table public.agent_knowledge_sources (
  id text primary key,
  organization_id uuid not null default private.current_organization_id() references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agent_configs(id) on delete cascade,
  kind text not null check (kind in ('url', 'text', 'file')),
  name text not null,
  url text,
  file_name text,
  content text,
  status text not null default 'ready' check (status in ('ready', 'pending', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_action_bindings (
  organization_id uuid not null default private.current_organization_id() references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agent_configs(id) on delete cascade,
  action_type text not null check (action_type in ('research', 'brief', 'save_visit_note', 'record_disposition', 'schedule_follow_up', 'suggest_route', 'update_pipeline')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (agent_id, action_type)
);

create table public.business_pipeline (
  organization_id uuid not null default private.current_organization_id() references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  stage text not null default 'new' check (stage in ('new', 'qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost')),
  estimated_value numeric not null default 0,
  next_action text not null default 'Research decision-maker timing',
  commitment text,
  updated_at timestamptz not null default now(),
  primary key (organization_id, business_id)
);

alter table public.agent_configs enable row level security;
alter table public.agent_knowledge_sources enable row level security;
alter table public.agent_action_bindings enable row level security;
alter table public.business_pipeline enable row level security;

create policy agent_configs_tenant on public.agent_configs
  for all to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy agent_knowledge_sources_tenant on public.agent_knowledge_sources
  for all to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy agent_action_bindings_tenant on public.agent_action_bindings
  for all to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy business_pipeline_tenant on public.business_pipeline
  for all to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

grant select, insert, update, delete on public.agent_configs, public.agent_knowledge_sources, public.agent_action_bindings, public.business_pipeline to authenticated;
