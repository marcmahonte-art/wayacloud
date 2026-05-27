-- ============================================================
-- Add FREE plan to storage_plans + rewrite trigger + update CRON
-- ============================================================

-- 1. Allow price = 0 for free plan
alter table public.storage_plans
  drop constraint if exists storage_plans_monthly_price_fcfa_check;

alter table public.storage_plans
  add constraint storage_plans_monthly_price_fcfa_check
  check (monthly_price_fcfa >= 0);

-- 2. Insert FREE plan (5GB, 0 FCFA)
do $$
begin
  if not exists (select 1 from public.storage_plans where name = 'Gratuit') then
    insert into public.storage_plans (name, storage_go, monthly_price_fcfa, is_active)
    values ('Gratuit', 5, 0, true);
  end if;
end;
$$;

-- 3. Rewrite handle_new_user: assign FREE plan (no trial)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _first_name text;
  _last_name text;
  _gender text;
  _city text;
  _phone text;
  _referral_code text;
  _referred_by text;
  _free_plan_id uuid;
begin
  _first_name := new.raw_user_meta_data ->> 'first_name';
  _last_name  := new.raw_user_meta_data ->> 'last_name';
  _gender     := new.raw_user_meta_data ->> 'gender';
  _city       := new.raw_user_meta_data ->> 'city';
  _phone      := new.raw_user_meta_data ->> 'phone';
  _referred_by := new.raw_user_meta_data ->> 'referred_by';

  _referral_code := lower(regexp_replace(
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'user')
    || '-' || substr(replace(new.id::text, '-', ''), 1, 6),
    '[^a-z0-9-]', '', 'g'
  ));

  if length(_referral_code) < 6 or _referral_code is null then
    _referral_code := substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.profiles (id, email, first_name, last_name, full_name, gender, city, phone, role, referral_code, referred_by)
  values (
    new.id,
    new.email,
    _first_name,
    _last_name,
    coalesce(nullif(trim(_first_name || ' ' || coalesce(_last_name, '')), ''), split_part(new.email, '@', 1)),
    _gender,
    _city,
    _phone,
    'user',
    _referral_code,
    _referred_by
  );

  insert into public.storage_quotas (user_id, storage_limit_bytes, storage_used_bytes)
  values (new.id, 5368709120, 0);

  -- Assign FREE plan (Gratuit, 5GB) by default
  _free_plan_id := (select id from public.storage_plans where name = 'Gratuit' and is_active = true limit 1);

  if _free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, starts_at, ends_at, is_active, is_trial, trial_ends_at)
    values (new.id, _free_plan_id, now(), null, true, false, null);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Update CRON 2: downgrade expired trial to FREE plan (5GB)
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule(
      'downgrade-expired-trials',
      '0 1 * * *',
      $cron$
      update public.storage_quotas q
      set storage_limit_bytes = 5368709120
      from public.subscriptions s
      where q.user_id = s.user_id
        and s.is_trial = true
        and s.trial_ends_at < now()
        and q.storage_limit_bytes > 5368709120;

      update public.subscriptions s
      set plan_id = (select id from public.storage_plans where name = 'Gratuit' and is_active = true limit 1),
          is_trial = false,
          trial_ends_at = null,
          ends_at = null,
          is_active = true
      from public.storage_quotas q
      where q.user_id = s.user_id
        and s.is_trial = true
        and s.trial_ends_at < now();
      $cron$
    );
  end if;
end;
$$;

-- 5. Add plan_id to payments (for webhook to know which plan was paid)
alter table public.payments
  add column if not exists plan_id uuid references public.storage_plans(id) on delete set null;

-- 6. Allow public to see active plans (for pricing page)
drop policy if exists "storage_plans_select_all" on public.storage_plans;
create policy "storage_plans_select_all"
on public.storage_plans for select
to anon, authenticated
using (is_active = true);
