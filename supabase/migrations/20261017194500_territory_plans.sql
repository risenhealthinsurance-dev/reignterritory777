create table public.territory_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_organization_id() references public.organizations(id) on delete cascade,
  plan_key text not null default 'active',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, plan_key)
);

alter table public.territory_plans enable row level security;

create policy territory_plans_tenant on public.territory_plans
  for all to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

grant select, insert, update, delete on public.territory_plans to authenticated;
