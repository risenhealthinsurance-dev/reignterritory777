create table if not exists public.rep_map_pins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_organization_id() references public.organizations(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  address text,
  note text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

alter table public.rep_map_pins enable row level security;

create policy "rep pins are readable by organization members"
  on public.rep_map_pins for select to authenticated
  using (private.is_organization_member(organization_id));

create policy "rep pins are writable by organization members"
  on public.rep_map_pins for insert to authenticated
  with check (private.is_organization_member(organization_id) and created_by = (select auth.uid()));

grant select, insert on public.rep_map_pins to authenticated;
