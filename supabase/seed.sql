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

insert into public.businesses (id, organization_id, display_name, status)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Apex Medical Group', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Isolation Control Business', 'active')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.source_registry (id, organization_id, name, base_url, license_name, rate_limit_notes)
values
  ('fort-pierce-gis', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fort Pierce GIS', 'https://services1.arcgis.com/oDRzuf2MGmdEHAbQ/ArcGIS/rest/services/DataMap_EnerGovMap/FeatureServer', 'Official public data', 'Page by service maxRecordCount'),
  ('official-website', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Official business website', null, 'Source-specific', 'Respect robots, terms, and caching'),
  ('rep', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Representative verification', null, 'First-party organization data', 'Not rate limited'),
  ('rep', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Representative verification', null, 'First-party organization data', 'Not rate limited')
on conflict (organization_id, id) do update set name = excluded.name;
