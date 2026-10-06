insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-a@example.test', '', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-b@example.test', '', now(), now(), now())
on conflict (id) do nothing;

insert into public.organizations (id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Reign Territory QA'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Isolation Control Org')
on conflict (id) do update set name = excluded.name;

insert into public.organization_members (organization_id, user_id, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'rep'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'rep')
on conflict do nothing;

insert into public.rep_profiles (id, organization_id, user_id, display_name)
values
  ('aaaaaaaa-1000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'QA Field Rep'),
  ('bbbbbbbb-1000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Isolation Rep')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.territories (id, organization_id, name)
values ('aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fort Pierce 34950')
on conflict (id) do update set name = excluded.name;

insert into public.territory_assignments (organization_id, territory_id, rep_profile_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001')
on conflict do nothing;

insert into public.businesses (id, organization_id, external_key, display_name, status)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'meridian', 'Meridian Medical Devices', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pacific', 'Pacific Rim Logistics', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'apex', 'Apex Manufacturing Group', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'solano', 'Solano Healthcare Partners', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'westside', 'Westside Distribution Co', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bravo', 'Bravo Industrial Supply', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'isolation', 'Isolation Control Business', 'active')
on conflict (id) do update set display_name = excluded.display_name, external_key = excluded.external_key;

insert into public.business_locations
  (id, organization_id, business_id, formatted_address, location, coordinate_status)
values
  ('aaaaaaaa-3000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', '100 N US Highway 1, Fort Pierce, FL 34950', extensions.st_setsrid(extensions.st_makepoint(-80.3256, 27.4488), 4326)::extensions.geography, 'verified'),
  ('aaaaaaaa-3000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000002', '500 Orange Ave, Fort Pierce, FL 34950', extensions.st_setsrid(extensions.st_makepoint(-80.3298, 27.4471), 4326)::extensions.geography, 'verified'),
  ('aaaaaaaa-3000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000003', '800 Virginia Ave, Fort Pierce, FL 34950', extensions.st_setsrid(extensions.st_makepoint(-80.3311, 27.4269), 4326)::extensions.geography, 'verified'),
  ('aaaaaaaa-3000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000004', '2215 Okeechobee Rd, Fort Pierce, FL 34950', extensions.st_setsrid(extensions.st_makepoint(-80.3478, 27.4321), 4326)::extensions.geography, 'verified'),
  ('aaaaaaaa-3000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000005', '130 S Indian River Dr, Fort Pierce, FL 34950', extensions.st_setsrid(extensions.st_makepoint(-80.3227, 27.4474), 4326)::extensions.geography, 'verified'),
  ('aaaaaaaa-3000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000006', '2400 Rhode Island Ave, Fort Pierce, FL 34950', extensions.st_setsrid(extensions.st_makepoint(-80.3509, 27.4428), 4326)::extensions.geography, 'verified')
on conflict (id) do update set formatted_address = excluded.formatted_address, location = excluded.location;

insert into public.source_registry (id, organization_id, name, base_url, license_name, rate_limit_notes)
values
  ('fort-pierce-gis', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fort Pierce GIS', 'https://services1.arcgis.com/oDRzuf2MGmdEHAbQ/ArcGIS/rest/services/DataMap_EnerGovMap/FeatureServer', 'Official public data', 'Page by service maxRecordCount'),
  ('official-website', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Official business website', null, 'Source-specific', 'Respect robots, terms, and caching'),
  ('rep', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Representative verification', null, 'First-party organization data', 'Not rate limited'),
  ('rep', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Representative verification', null, 'First-party organization data', 'Not rate limited')
on conflict (organization_id, id) do update set name = excluded.name;

insert into public.source_observations
  (id, organization_id, entity_type, entity_id, field_name, field_value, source_id, retrieved_at, confidence)
values
  ('aaaaaaaa-4000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000001', 'rep_note', to_jsonb('Sandra is the decision maker; CFO approval is needed for deals over $200K.'::text), 'rep', '2026-10-04T12:00:00Z', 1),
  ('aaaaaaaa-4000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000002', 'rep_note', to_jsonb('David has budget authority up to $75K.'::text), 'rep', '2026-10-04T12:00:00Z', 1),
  ('aaaaaaaa-4000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000003', 'rep_note', to_jsonb('Board approval is required for the enterprise tier.'::text), 'rep', '2026-10-04T12:00:00Z', 1),
  ('aaaaaaaa-4000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000004', 'rep_note', to_jsonb('Best contact window is Tuesday or Thursday morning.'::text), 'rep', '2026-10-04T12:00:00Z', 1),
  ('aaaaaaaa-4000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000005', 'rep_note', to_jsonb('The starter package is closed; onboarding is scheduled for Nov 1.'::text), 'rep', '2026-10-04T12:00:00Z', 1),
  ('aaaaaaaa-4000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000006', 'rep_note', to_jsonb('Lisa mentioned evaluating a competitor in August.'::text), 'rep', '2026-10-04T12:00:00Z', 1)
on conflict (id) do update set field_value = excluded.field_value, retrieved_at = excluded.retrieved_at;
