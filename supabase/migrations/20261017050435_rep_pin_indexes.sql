create index if not exists rep_map_pins_organization_created_at_idx
  on public.rep_map_pins (organization_id, created_at);

create index if not exists rep_map_pins_created_by_idx
  on public.rep_map_pins (created_by);
