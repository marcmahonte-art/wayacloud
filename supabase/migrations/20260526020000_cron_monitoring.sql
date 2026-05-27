-- ============================================================
-- CRON jobs & Monitoring for WayaCloud
-- ============================================================

-- 1. Enable pg_cron extension
create extension if not exists pg_cron with schema pg_catalog;

-- 2. sms_queue table
create table if not exists public.sms_queue (
  id bigserial primary key,
  phone text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_sms_queue_status on public.sms_queue (status, created_at);

-- 3. system_alerts table
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

-- 4. Add trash columns to files
alter table public.files
  add column if not exists is_trashed boolean not null default false,
  add column if not exists trashed_at timestamptz;

-- 5. Add twilio phone number to env config (stored in a config table)
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
insert into public.app_config (key, value) values ('twilio_phone_number', '+22600000000') on conflict (key) do nothing;

-- Enable RLS on new tables
alter table public.sms_queue enable row level security;
alter table public.system_alerts enable row level security;

-- RLS: admins only
create policy "sms_queue_admin_all"
  on public.sms_queue for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

create policy "system_alerts_admin_select"
  on public.system_alerts for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

-- Edge function can bypass RLS via service_role
alter table public.sms_queue force row level security;
alter table public.system_alerts force row level security;

-- ============================================================
-- CRON 1 — Every hour: Recalculate real quota
-- ============================================================
select cron.schedule(
  'recalculate-quota',
  '0 * * * *',
  $$
  update public.storage_quotas q
  set storage_used_bytes = coalesce(
    (select coalesce(sum(f.size_bytes), 0)
     from public.files f
     where f.owner_id = q.user_id
       and f.status != 'deleted'
       and f.is_trashed = false),
    0
  )
  where exists (select 1 from public.files f where f.owner_id = q.user_id);
  $$
);

-- ============================================================
-- CRON 2 — Every day at 1am: Downgrade expired trial to 3 GB
-- ============================================================
select cron.schedule(
  'downgrade-expired-trials',
  '0 1 * * *',
  $$
  update public.storage_quotas q
  set storage_limit_bytes = 3221225472
  from public.subscriptions s
  where q.user_id = s.user_id
    and s.is_trial = true
    and s.trial_ends_at < now()
    and q.storage_limit_bytes > 3221225472;
  $$
);

-- ============================================================
-- CRON 3 — Every day at 8am: SMS renewal D-30
-- ============================================================
select cron.schedule(
  'sms-renewal-d30',
  '0 8 * * *',
  $$
  insert into public.sms_queue (phone, message)
  select p.phone,
    'WayaCloud: Votre abonnement expire dans 30 jours. Rendez-vous sur wayacloud.bf pour le renouveler.'
  from public.profiles p
  join public.subscriptions s on s.user_id = p.id
  where s.is_active = true
    and s.ends_at between now() and now() + interval '30 days'
    and p.phone is not null
  on conflict do nothing;
  $$
);

-- ============================================================
-- CRON 4 — Every 6 hours: Alert if catalog not backed up 48h
-- ============================================================
select cron.schedule(
  'alert-no-backup-48h',
  '0 */6 * * *',
  $$
  insert into public.sms_queue (phone, message)
  select p.phone,
    'WayaCloud Business: Votre catalogue n''a pas été sauvegardé depuis 48h. Connectez-vous sur wayacloud.bf.'
  from public.profiles p
  join public.subscriptions s on s.user_id = p.id
  join public.storage_plans sp on sp.id = s.plan_id
  where sp.name = 'Business'
    and s.is_active = true
    and p.phone is not null
    and not exists (
      select 1 from public.files f
      where f.owner_id = p.id
        and f.created_at > now() - interval '48 hours'
        and f.is_trashed = false
    );
  $$
);

-- ============================================================
-- CRON 5 — Every hour: Alert if upload failure rate > 5%
-- ============================================================
select cron.schedule(
  'alert-upload-failure-rate',
  '0 * * * *',
  $$
  insert into public.system_alerts (alert_type, severity, message, metadata)
  select
    'upload_failure_rate',
    'warning',
    'Taux d''échec d''upload > 5% sur la dernière heure.',
    jsonb_build_object(
      'total_uploads', total,
      'failed_uploads', failed,
      'failure_rate_pct', round((failed::numeric / nullif(total, 0)) * 100, 1)
    )
  from (
    select
      count(*) as total,
      count(*) filter (where status = 'failed') as failed
    from public.files
    where created_at > now() - interval '1 hour'
  ) stats
  where total > 0
    and (failed::numeric / total) * 100 > 5
    and not exists (
      select 1 from public.system_alerts
      where alert_type = 'upload_failure_rate'
        and resolved_at is null
    );
  $$
);

-- ============================================================
-- CRON 6 — Every day at 2am: Permanently delete trash older than 30 days
-- ============================================================
select cron.schedule(
  'clean-old-trash',
  '0 2 * * *',
  $$
  update public.files
  set status = 'deleted',
      updated_at = now()
  where is_trashed = true
    and trashed_at < now() - interval '30 days'
    and status != 'deleted';
  $$
);
