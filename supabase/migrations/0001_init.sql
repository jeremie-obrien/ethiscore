-- EthiScore schema. Run once in the Supabase dashboard (SQL Editor → New query → paste → Run).
--
-- Privacy is enforced here with row-level security, not just in app code:
--   * criteria_sets: everyone signed in can read the built-in sets (user_id is null);
--     each user can read and change only their own sets.
--   * evaluations, user_preferences: each user can only ever see and change their own rows.
-- Signed-out visitors (the "anon" role) get no access to any table.

create table public.criteria_sets (
  id uuid primary key default gen_random_uuid(),
  -- null = built-in set shared with everyone (only creatable from this migration).
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  criteria jsonb not null
    check (jsonb_typeof(criteria) = 'array' and jsonb_array_length(criteria) between 1 and 50),
  created_at timestamptz not null default now()
);
create index criteria_sets_user_id_idx on public.criteria_sets (user_id);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  company text not null check (char_length(company) between 1 and 200),
  model text not null,
  -- No foreign key: an evaluation keeps its criteria set's id and name after that set is deleted.
  criteria_set_id uuid not null,
  criteria_set_name text not null,
  criteria jsonb not null,
  overall_score double precision not null check (overall_score between 0 and 1),
  overall_summary text not null
);
create index evaluations_user_id_created_at_idx on public.evaluations (user_id, created_at desc);

-- One row per user. No row = the built-in ESG set is the default; a row with a null
-- default_criteria_set_id = the user explicitly chose no default.
create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  default_criteria_set_id uuid references public.criteria_sets (id) on delete set null
);

alter table public.criteria_sets enable row level security;
alter table public.evaluations enable row level security;
alter table public.user_preferences enable row level security;

revoke all on public.criteria_sets, public.evaluations, public.user_preferences from anon;
grant select, insert, update, delete on public.criteria_sets, public.evaluations, public.user_preferences
  to authenticated;

create policy "Read built-in and own criteria sets" on public.criteria_sets
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "Create own criteria sets" on public.criteria_sets
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Update own criteria sets" on public.criteria_sets
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Delete own criteria sets" on public.criteria_sets
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Own evaluations only" on public.evaluations
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Own preferences only" on public.user_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Built-in criteria sets. Fixed ids so the app can refer to ESG as the fallback default
-- (BUILT_IN_DEFAULT_CRITERIA_SET_ID in lib/storage/criteriaSets.ts).
insert into public.criteria_sets (id, user_id, name, criteria, created_at) values
(
  '00000000-0000-4000-8000-000000000001', null, 'ESG',
  '[
    {"name": "Environmental practices", "description": "Sustainability initiatives, emissions reduction, and resource stewardship. Reward reputable environmental certifications (e.g. B Corp, LEED, ISO 14001).", "weight": 1},
    {"name": "Social responsibility", "description": "Labor practices, diversity & inclusion, community impact, and human rights record. Reward reputable social/labor certifications (e.g. Fair Trade, SA8000).", "weight": 1},
    {"name": "Governance quality", "description": "Board independence, executive accountability, transparency, and anti-corruption practices. Reward strong governance ratings and certifications (e.g. ISO 37001).", "weight": 1}
  ]'::jsonb,
  '2026-01-01T00:00:00.002Z'
),
(
  '00000000-0000-4000-8000-000000000002', null, 'Innovation & advancing humanity',
  '[
    {"name": "R&D investment & output", "description": "R&D spend relative to revenue, patents, publications, and breakthrough technologies produced.", "weight": 1},
    {"name": "Scientific & open contribution", "description": "Open-source contributions, published research, and tools or data shared with the broader field rather than kept proprietary.", "weight": 1},
    {"name": "Long-term / frontier impact", "description": "Work on hard, high-leverage problems (health, climate, fundamental science, education access) versus purely incremental commercial products.", "weight": 1}
  ]'::jsonb,
  '2026-01-01T00:00:00.001Z'
),
(
  '00000000-0000-4000-8000-000000000003', null, 'Environment',
  '[
    {"name": "Carbon footprint & emissions", "description": "Absolute and trending greenhouse gas emissions, and the credibility of any net-zero targets.", "weight": 1},
    {"name": "Resource use & waste", "description": "Water usage, waste management, circular economy practices, and resource efficiency.", "weight": 1},
    {"name": "Environmental certifications & compliance", "description": "Recognized certifications (e.g. ISO 14001, LEED) and regulatory compliance record, including violations or fines.", "weight": 1}
  ]'::jsonb,
  '2026-01-01T00:00:00.000Z'
);
