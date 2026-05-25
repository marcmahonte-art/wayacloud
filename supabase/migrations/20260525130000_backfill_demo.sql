-- Backfill profile, storage quota, and trial subscription for existing demo user
do $$
declare
  _user_id uuid;
begin
  select id into _user_id from auth.users where email = 'demo@wayacloud.app';
  if not found then
    raise notice 'Demo user not found - skipping backfill';
    return;
  end if;

  insert into public.profiles (id, email, first_name, last_name, full_name, role)
  values (_user_id, 'demo@wayacloud.app', 'Demo', 'User', 'Demo User', 'user')
  on conflict (id) do nothing;

  insert into public.storage_quotas (user_id, storage_limit_bytes, storage_used_bytes)
  values (_user_id, 5368709120, 0)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan_id, starts_at, ends_at, is_active, is_trial, trial_ends_at)
  values (
    _user_id,
    (select id from public.storage_plans where is_active = true order by monthly_price_fcfa asc limit 1),
    now(),
    now() + interval '45 days',
    true,
    true,
    now() + interval '45 days'
  )
  on conflict do nothing;

  raise notice 'Backfill complete for demo user: %', _user_id;
end;
$$;
