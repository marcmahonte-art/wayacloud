-- ============================================================
-- WayaCloud Super Admin: Realtime Dashboard Infrastructure
-- View: dashboard_metrics, Table: system_health, Realtime
-- ============================================================

-- 1. dashboard_metrics: aggregated live platform stats
create or replace view public.dashboard_metrics as
select
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.profiles where created_at > now() - interval '7 days') as new_users_week,
  (select count(*) from public.files where is_trashed = false) as total_files,
  (select count(*) from public.files where is_trashed = false and created_at > current_date) as today_uploads,
  (select coalesce(sum(storage_used_bytes), 0) from public.storage_quotas) as total_storage_bytes,
  (select coalesce(sum(storage_limit_bytes), 0) from public.storage_quotas) as total_limit_bytes,
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'paid') as total_revenue,
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'paid' and created_at > now() - interval '30 days') as monthly_revenue,
  (select count(*) from public.subscriptions where is_active = true and is_trial = false) as premium_subscribers,
  (select count(*) from public.subscriptions where is_trial = true) as trial_users,
  (select count(*) from public.ai_events) as total_ai_requests,
  (select count(*) from public.files where is_trashed = false and mime_type ilike 'image/%') as total_images,
  (select count(*) from public.files where is_trashed = false and mime_type ilike 'video/%') as total_videos,
  (select count(*) from public.files where is_trashed = false and mime_type ilike 'audio/%') as total_audios,
  (select count(*) from public.files where is_trashed = false and mime_type ilike '%pdf%') as total_pdfs;

-- 2. system_health: service health monitoring
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

create policy "system_health_admin_select"
  on public.system_health for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

-- Seed initial health checks
insert into public.system_health (service, status, latency_ms) values
  ('database', 'healthy', 0),
  ('storage', 'healthy', 0),
  ('api', 'healthy', 0),
  ('ai', 'healthy', 0),
  ('cinetpay', 'healthy', 0),
  ('whatsapp', 'healthy', 0)
on conflict (service) do nothing;

-- 3. Enable realtime for system_alerts (already exists but ensure publication)
alter publication supabase_realtime add table public.system_alerts;

-- 4. Enable realtime for system_health
alter publication supabase_realtime add table public.system_health;

-- 5. Enable realtime for dashboard_metrics (as a view, we need a different approach)
-- Views cannot be added to publications directly, so we'll use a refresh function
create or replace function public.refresh_dashboard_metrics()
returns void
language plpgsql
security definer
as $$
begin
  null; -- The view queries live data every time, no refresh needed
end;
$$;

-- 6. Function to log admin audit actions
create or replace function public.log_admin_action(
  p_admin_id uuid,
  p_action text,
  p_target_table text,
  p_target_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.admin_audit_logs (admin_id, action, target_table, target_id, metadata)
  values (p_admin_id, p_action, p_target_table, p_target_id, p_metadata);
end;
$$;

-- 7. Trigger: auto-create system_alert on payment failure > 3 in 1 hour
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
        'Plus de ' || recent_failures || ' paiements échoués dans la dernière heure.',
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

-- 8. Trigger: auto-create system_alert on new user signup surge
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
  from public.profiles
  where created_at > now() - interval '1 hour';

  select count(*) into signups_yesterday_same_hour
  from public.profiles
  where created_at > now() - interval '25 hours'
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

drop trigger if exists trg_alert_signup_surge on public.profiles;
create trigger trg_alert_signup_surge
  after insert on public.profiles
  for each row
  execute function public.alert_signup_surge();

-- 9. Enable realtime for payments table (needed for admin dashboard revenue updates)
alter publication supabase_realtime add table public.payments;

-- 10. Enable realtime for profiles table (needed for admin user count updates)
alter publication supabase_realtime add table public.profiles;
