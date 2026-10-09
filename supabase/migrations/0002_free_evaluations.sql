-- Free evaluations run on EthiScore's own Anthropic key, limited per month per email, per
-- network and per browser, plus a global daily cap. Run once in the Supabase dashboard
-- (SQL Editor → New query → paste → Run), after 0001_init.sql.
--
-- Only the server (Supabase secret key / service_role) can touch this table or these
-- functions: browsers can neither read their counts nor reset them.

create table public.free_evaluation_claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- No foreign key on purpose: deleting an account must not reset its allowance.
  user_id uuid not null,
  -- Keyed hashes (HMAC-SHA256, secret held by the server), never the raw email/IP/cookie.
  email_key text not null,
  network_key text not null,
  browser_key text not null,
  status text not null default 'reserved' check (status in ('reserved', 'used'))
);
create index free_evaluation_claims_created_at_idx on public.free_evaluation_claims (created_at);
create index free_evaluation_claims_email_idx on public.free_evaluation_claims (email_key, created_at);
create index free_evaluation_claims_network_idx on public.free_evaluation_claims (network_key, created_at);
create index free_evaluation_claims_browser_idx on public.free_evaluation_claims (browser_key, created_at);

alter table public.free_evaluation_claims enable row level security;
revoke all on public.free_evaluation_claims from anon, authenticated;
-- (No policies: with RLS on and no policy, only service_role, which bypasses RLS, has access.)

-- Free evaluations used this calendar month (UTC) by the most-used of the three identities.
create function public.free_evaluations_used(p_email text, p_network text, p_browser text)
returns integer
language sql
stable
set search_path = ''
as $$
  select greatest(
    (select count(*) from public.free_evaluation_claims
      where email_key = p_email and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'),
    (select count(*) from public.free_evaluation_claims
      where network_key = p_network and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'),
    (select count(*) from public.free_evaluation_claims
      where browser_key = p_browser and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc')
  )::integer;
$$;

-- Atomically checks the limits and reserves one free evaluation. Returns
-- {"claim_id": ...} on success or {"reason": "monthly_limit" | "daily_cap"}.
create function public.claim_free_evaluation(
  p_user uuid, p_email text, p_network text, p_browser text, p_monthly_limit integer, p_daily_cap integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  -- Serialize claims so concurrent requests can't both slip under a limit.
  perform pg_advisory_xact_lock(hashtext('ethiscore_free_evaluation_claims'));

  -- Keep only what the monthly limits need (plus margin): ~2 months.
  delete from public.free_evaluation_claims where created_at < now() - interval '62 days';

  if public.free_evaluations_used(p_email, p_network, p_browser) >= p_monthly_limit then
    return jsonb_build_object('reason', 'monthly_limit');
  end if;
  if (select count(*) from public.free_evaluation_claims
      where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc') >= p_daily_cap then
    return jsonb_build_object('reason', 'daily_cap');
  end if;

  insert into public.free_evaluation_claims (user_id, email_key, network_key, browser_key)
  values (p_user, p_email, p_network, p_browser)
  returning id into v_id;
  return jsonb_build_object('claim_id', v_id);
end;
$$;

-- A failed evaluation gives the free evaluation back.
create function public.release_free_evaluation(p_claim uuid)
returns void
language sql
set search_path = ''
as $$
  delete from public.free_evaluation_claims where id = p_claim and status = 'reserved';
$$;

create function public.confirm_free_evaluation(p_claim uuid)
returns void
language sql
set search_path = ''
as $$
  update public.free_evaluation_claims set status = 'used' where id = p_claim;
$$;

revoke all on function public.free_evaluations_used(text, text, text) from public, anon, authenticated;
revoke all on function public.claim_free_evaluation(uuid, text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.release_free_evaluation(uuid) from public, anon, authenticated;
revoke all on function public.confirm_free_evaluation(uuid) from public, anon, authenticated;
grant execute on function public.free_evaluations_used(text, text, text) to service_role;
grant execute on function public.claim_free_evaluation(uuid, text, text, text, integer, integer) to service_role;
grant execute on function public.release_free_evaluation(uuid) to service_role;
grant execute on function public.confirm_free_evaluation(uuid) to service_role;
