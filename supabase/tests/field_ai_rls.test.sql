begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'organization_members', 'membership table exists');
select has_table('public', 'businesses', 'businesses table exists');
select has_table('public', 'source_observations', 'source observations table exists');
select has_table('public', 'zoning_districts', 'zoning table exists');
select has_table('public', 'address_points', 'official address points table exists');
select has_table('public', 'ai_runs', 'AI audit table exists');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$ select count(*)::bigint from public.businesses $$,
  array[1::bigint],
  'representative sees businesses in their organization'
);
select results_eq(
  $$ select count(*)::bigint from public.businesses where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  array[0::bigint],
  'representative cannot see another organization businesses'
);
select lives_ok(
  $$ insert into public.source_observations
       (organization_id, entity_type, entity_id, field_name, field_value, source_id, retrieved_at, confidence)
     values
       ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'business', 'aaaaaaaa-0000-0000-0000-000000000001', 'phone', '7725550100', 'rep', now(), 1) $$,
  'representative can add evidence to their organization'
);
select throws_ok(
  $$ insert into public.source_observations
       (organization_id, entity_type, entity_id, field_name, field_value, source_id, retrieved_at, confidence)
     values
       ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'business', 'bbbbbbbb-0000-0000-0000-000000000001', 'phone', '7725550199', 'rep', now(), 1) $$,
  '42501',
  null,
  'representative cannot insert evidence for another organization'
);

reset role;
set local role anon;
select results_eq(
  $$ select count(*)::bigint from public.businesses $$,
  array[0::bigint],
  'anonymous users see no businesses'
);
select throws_ok(
  $$ insert into public.businesses (organization_id, display_name)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Unauthorized') $$,
  '42501',
  null,
  'anonymous users cannot create businesses'
);

select * from finish();
rollback;
