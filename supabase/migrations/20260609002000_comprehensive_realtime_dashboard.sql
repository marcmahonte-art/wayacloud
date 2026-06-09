-- ============================================================
-- WayaCloud Super Admin: Comprehensive Realtime Dashboard v2
-- Fixes gaps: activity types, realtime subscriptions, triggers
-- ============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Add missing activity types to the check constraint
do $$
begin
  alter table public.activities drop constraint if exists activities_type_check;
  alter table public.activities add constraint activities_type_check
    check (type in (
      'upload','delete','trash','restore','empty_trash',
      'share','share_download','rename','folder_create',
      'ai_action','backup','catalog_backup',
      'payment','subscription','signup','login',
      'whatsapp_backup'
    ));
exception when others then null;
end;
$$;

-- 2. Comprehensive dashboard_metrics view (live aggregation)
drop view if exists public.dashboard_metrics cascade;
create view public.dashboard_metrics as
select
  -- Users
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.profiles where created_at > now() - interval '7 days') as new_users_week,
  (select count(*) from public.profiles where created_at > current_date) as new_users_today,
  (select count(*) from public.profiles where role = 'admin' or role = 'super_admin') as total_admins,

  -- Files
  (select count(*) from public.files where is_trashed = false) as total_files,
  (select count(*) from public.files where is_trashed = false and created_at > current_date) as today_uploads,
  (select count(*) from public.files where is_trashed = true) as total_trashed,
  (select count(*) from public.files where status = 'failed') as failed_uploads,

  -- Storage
  (select coalesce(sum(storage_used_bytes), 0) from public.storage_quotas) as total_storage_bytes,
  (select coalesce(sum(storage_limit_bytes), 0) from public.storage_quotas) as total_limit_bytes,

  -- Revenue
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'paid') as total_revenue,
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'paid' and created_at > now() - interval '30 days') as monthly_revenue,
  (select count(*) from public.payments where status = 'paid' and created_at > current_date) as today_revenue_count,
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'paid' and created_at > current_date) as today_revenue_amount,
  (select count(*) from public.payments where status in ('failed', 'cancelled')) as failed_payments,

  -- Subscriptions (premium = paid plan, not free and not trial)
  (select count(*) from public.subscriptions s join public.storage_plans p on p.id = s.plan_id where s.is_active = true and s.is_trial = false and p.monthly_price_fcfa > 0) as premium_subscribers,
  (select count(*) from public.subscriptions where is_trial = true) as trial_users,
  (select count(*) from public.subscriptions where is_active = true) as total_active_subscriptions,

  -- AI
  (select count(*) from public.ai_events) as total_ai_requests,
  (select count(*) from public.ai_events where created_at > current_date) as today_ai_requests,

  -- WhatsApp (count of WhatsApp-related activities)
  (select coalesce(count(distinct user_id), 0) from public.activities where type = 'whatsapp_backup') as whatsapp_protected_users,
  (select coalesce(count(*), 0) from public.activities where type = 'whatsapp_backup' and created_at > current_date) as today_whatsapp_backups,

  -- Activity
  (select count(*) from public.activities where created_at > current_date) as today_activities,
  (select count(*) from public.activities where type = 'signup' and created_at > current_date) as today_signups,
  (select count(*) from public.activities where type = 'login' and created_at > current_date) as today_logins,
  (select count(*) from public.activities where type = 'payment' and created_at > current_date) as today_payments;

-- 3. system_alerts table (if not exists)
create table if not exists public.system_alerts (
  id bigserial primary key,
  alert_type text not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  message text not null,
  metadata jsonb default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_system_alerts_unresolved on public.system_alerts (alert_type, resolved_at);

alter table public.system_alerts enable row level security;

drop policy if exists "system_alerts_admin_select" on public.system_alerts;
create policy "system_alerts_admin_select"
  on public.system_alerts for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

drop policy if exists "system_alerts_admin_update" on public.system_alerts;
create policy "system_alerts_admin_update"
  on public.system_alerts for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

-- 4. system_health table (if not exists)
create table if not exists public.system_health (
  id bigserial primary key,
  service text not null,
  status text not null check (status in ('healthy', 'degraded', 'down')),
  latency_ms integer,
  last_checked timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  unique(service)
);

alter table public.system_health enable row level security;

drop policy if exists "system_health_admin_select" on public.system_health;
create policy "system_health_admin_select"
  on public.system_health for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

-- 5. Enable realtime for ALL tables needed by dashboard
do $$
begin
  alter publication supabase_realtime add table public.files;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.storage_quotas;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.activities;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.payments;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.system_alerts;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.system_health;
exception when others then null;
end;
$$;
do $$
begin
  alter publication supabase_realtime add table public.subscriptions;
exception when others then null;
end;
$$;

-- 6. Auto-log signup in handle_new_user trigger
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
  values (new.id, 5368709120, 0)
  on conflict (user_id) do nothing;

  _free_plan_id := (select id from public.storage_plans where name = 'Gratuit' and is_active = true limit 1);

  if _free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, starts_at, ends_at, is_active, is_trial, trial_ends_at)
    values (new.id, _free_plan_id, now(), null, true, false, null);
  end if;

  -- Log signup activity
  insert into public.activities (user_id, type, title, description, metadata)
  values (
    new.id,
    'signup',
    'Inscription',
    'Nouvel utilisateur inscrit',
    jsonb_build_object('email', new.email)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Function to log login activity
create or replace function public.log_login_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.activities (user_id, type, title, description, metadata)
  values (
    new.id,
    'login',
    'Connexion',
    'Utilisateur connecté',
    jsonb_build_object('email', new.email, 'provider', new.raw_app_meta_data ->> 'provider')
  );
  return new;
end;
$$;

-- 8. Auto-log file share download
create or replace function public.log_share_download()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
  v_file_name text;
begin
  select f.owner_id, f.name into v_owner_id, v_file_name
  from public.share_links sl
  join public.files f on f.id = sl.file_id
  where sl.id = new.share_link_id;

  if v_owner_id is not null then
    insert into public.activities (user_id, type, title, description, metadata)
    values (
      v_owner_id,
      'share_download',
      v_file_name || ' téléchargé',
      'Fichier téléchargé via lien de partage',
      jsonb_build_object('share_link_id', new.share_link_id, 'file_name', v_file_name)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_share_download on public.download_logs;
create trigger trg_log_share_download
  after insert on public.download_logs
  for each row execute function public.log_share_download();

-- 9. Improved payment failure alert trigger
create or replace function public.alert_payment_failures()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_failures int;
begin
  if new.status in ('failed', 'cancelled') then
    select count(*) into recent_failures
    from public.payments
    where status in ('failed', 'cancelled')
      and created_at > now() - interval '1 hour';
    if recent_failures >= 3 then
      insert into public.system_alerts (alert_type, severity, message, metadata)
      values (
        'payment_failure_rate',
        'warning',
        recent_failures || ' paiements échoués dans la dernière heure.',
        jsonb_build_object('failed_count', recent_failures, 'last_payment_id', new.id)
      )
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_alert_payment_failures on public.payments;
create trigger trg_alert_payment_failures
  after insert on public.payments
  for each row
  execute function public.alert_payment_failures();

-- 10. Signup surge alert (reset)
create or replace function public.alert_signup_surge()
returns trigger
language plpgsql
security definer
as $$
declare
  signups_last_hour int;
  signups_yesterday_same_hour int;
begin
  select count(*) into signups_last_hour
  from public.activities
  where type = 'signup'
    and created_at > now() - interval '1 hour';

  select count(*) into signups_yesterday_same_hour
  from public.activities
  where type = 'signup'
    and created_at > now() - interval '25 hours'
    and created_at <= now() - interval '24 hours';

  if signups_last_hour > signups_yesterday_same_hour * 3
     and signups_last_hour >= 10 then
    insert into public.system_alerts (alert_type, severity, message, metadata)
    values (
      'signup_surge',
      'info',
      'Pic d''inscriptions : ' || signups_last_hour || ' dans la dernière heure.',
      jsonb_build_object('signups_last_hour', signups_last_hour, 'signups_yesterday_same_hour', signups_yesterday_same_hour)
    );
  end if;
  return new;
end;
$$;

-- Drop old trigger on profiles if it exists (from previous migration)
drop trigger if exists trg_alert_signup_surge on public.profiles;
drop trigger if exists trg_alert_signup_surge on public.activities;
create trigger trg_alert_signup_surge
  after insert on public.activities
  for each row
  when (new.type = 'signup')
  execute function public.alert_signup_surge();

-- 11. Function: get_activity_type_stats (for admin filters)
create or replace function public.get_activity_type_stats()
returns table (type text, count bigint)
language plpgsql
security definer
as $$
begin
  return query
  select a.type, count(*)::bigint
  from public.activities a
  group by a.type
  order by count(*) desc;
end;
$$;
