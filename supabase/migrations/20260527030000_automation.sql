-- ============================================================
-- MASTER AUTOMATION: activities, triggers, cron, realtime
-- ============================================================

-- 0. Extensions
create extension if not exists "pg_cron" with schema pg_cron;
create extension if not exists "pg_net" with schema extensions;

-- 0b. Add last_catalog_backup to profiles
alter table public.profiles
  add column if not exists last_catalog_backup timestamptz;

-- 1. ACTIVITIES TABLE
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'upload','delete','trash','restore','empty_trash',
    'share','rename','folder_create',
    'ai_action','backup','catalog_backup',
    'payment','subscription','signup'
  )),
  title text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_user_id on public.activities (user_id);
create index if not exists idx_activities_created_at on public.activities (created_at desc);

alter table public.activities enable row level security;

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own"
  on public.activities for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own"
  on public.activities for insert
  to authenticated
  with check (user_id = auth.uid());

-- Enable realtime for activities
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.files;
alter publication supabase_realtime add table public.storage_quotas;

-- 2. NOTIFICATION PREFERENCES
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  email_upload boolean not null default true,
  email_backup boolean not null default true,
  email_share boolean not null default true,
  email_payment boolean not null default true,
  email_marketing boolean not null default false,
  push_upload boolean not null default true,
  push_backup boolean not null default true,
  push_share boolean not null default true,
  push_storage_warning boolean not null default true,
  sms_payment boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
drop policy if exists "notif_prefs_select_own" on public.notification_preferences;
create policy "notif_prefs_select_own"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());
drop policy if exists "notif_prefs_upsert_own" on public.notification_preferences;
create policy "notif_prefs_upsert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());
drop policy if exists "notif_prefs_update_own" on public.notification_preferences;
create policy "notif_prefs_update_own"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-create notification_preferences on signup
create or replace function public.handle_new_user_notif_prefs()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_user_created_notif_prefs on auth.users;
create trigger on_user_created_notif_prefs
  after insert on auth.users
  for each row execute function public.handle_new_user_notif_prefs();

-- 3. ACTIVITY INSERTION FUNCTION
create or replace function public.insert_activity(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.activities (user_id, type, title, description, metadata)
  values (p_user_id, p_type, p_title, p_description, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

-- 4. STORAGE QUOTA RECALCULATION ENGINE
create or replace function public.recalculate_storage_quota(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_total bigint;
begin
  select coalesce(sum(size_bytes), 0)
  into v_total
  from public.files
  where owner_id = p_user_id
    and status = 'uploaded'
    and (is_trashed = false or is_trashed is null);

  update public.storage_quotas
  set storage_used_bytes = v_total,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- 5. FILE-LEVEL TRIGGERS

-- 5a. On file INSERT (upload)
create or replace function public.on_file_uploaded()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.insert_activity(
    new.owner_id,
    'upload',
    new.name || ' importé',
    'Fichier importé avec succès',
    jsonb_build_object('file_id', new.id, 'file_name', new.name, 'size_bytes', new.size_bytes, 'mime_type', new.mime_type)
  );
  perform public.recalculate_storage_quota(new.owner_id);
  return new;
end;
$$;

drop trigger if exists on_file_uploaded_trigger on public.files;
create trigger on_file_uploaded_trigger
  after insert on public.files
  for each row execute function public.on_file_uploaded();

-- 5b. On file UPDATE (trash / restore / rename)
create or replace function public.on_file_updated()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Trashed
  if new.is_trashed = true and (old.is_trashed = false or old.is_trashed is null) then
    perform public.insert_activity(
      new.owner_id,
      'trash',
      new.name || ' déplacé vers la corbeille',
      null,
      jsonb_build_object('file_id', new.id, 'file_name', new.name)
    );
    perform public.recalculate_storage_quota(new.owner_id);

  -- Restored
  elseif (new.is_trashed = false or new.is_trashed is null) and old.is_trashed = true then
    perform public.insert_activity(
      new.owner_id,
      'restore',
      new.name || ' restauré',
      null,
      jsonb_build_object('file_id', new.id, 'file_name', new.name)
    );
    perform public.recalculate_storage_quota(new.owner_id);

  -- Renamed
  elseif new.name is distinct from old.name then
    perform public.insert_activity(
      new.owner_id,
      'rename',
      old.name || ' renommé en ' || new.name,
      null,
      jsonb_build_object('file_id', new.id, 'old_name', old.name, 'new_name', new.name)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_file_updated_trigger on public.files;
create trigger on_file_updated_trigger
  after update on public.files
  for each row
  when (old.* is distinct from new.*)
  execute function public.on_file_updated();

-- 5c. On file DELETE (permanent)
create or replace function public.on_file_deleted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recalculate_storage_quota(old.owner_id);
  return old;
end;
$$;

drop trigger if exists on_file_deleted_trigger on public.files;
create trigger on_file_deleted_trigger
  after delete on public.files
  for each row execute function public.on_file_deleted();

-- 6. CRON JOBS

-- 6a. Empty trash: permanently delete files trashed > 30 days
create or replace function public.cleanup_trash_30d()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_record record;
begin
  for v_record in
    select id, owner_id, name from public.files
    where is_trashed = true
      and trashed_at < now() - interval '30 days'
  loop
    perform public.insert_activity(
      v_record.owner_id,
      'delete',
      v_record.name || ' supprimé définitivement (corbeille > 30 jours)',
      null,
      jsonb_build_object('file_id', v_record.id)
    );
  end loop;

  delete from public.files
  where is_trashed = true
    and trashed_at < now() - interval '30 days';

  -- Recalculate affected users
  update public.storage_quotas q
  set storage_used_bytes = coalesce((
    select sum(size_bytes) from public.files f
    where f.owner_id = q.user_id
      and f.status = 'uploaded'
      and (f.is_trashed = false or f.is_trashed is null)
  ), 0),
  updated_at = now()
  where q.user_id in (
    select distinct owner_id from public.files
    where is_trashed = true
      and trashed_at < now() - interval '30 days'
  );
end;
$$;

-- Schedule: run daily at 3am
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('cleanup-trash-30d', '0 3 * * *', 'select public.cleanup_trash_30d();');
  end if;
end;
$$;

-- 6b. Catalog backup check (every 6 hours)
create or replace function public.check_catalog_backup()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- This function is a hook point for the edge function
  -- It triggers the backup-monitor edge function via pg_net
  -- The actual scanning happens in the edge function
  perform net.http_post(
    url := current_setting('app.settings.backup_monitor_url', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('type', 'catalog_backup')
  );
end;
$$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('catalog-backup-check', '0 */6 * * *', 'select public.check_catalog_backup();');
  end if;
end;
$$;

-- 7. HEALTH CHECK: auto-monitor
create or replace function public.auto_health_check()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_upload_failures int;
  v_storage_growth bigint;
  v_payment_silence_hours int;
begin
  -- Check for upload failures in last hour
  select count(*) into v_upload_failures
  from public.files
  where status = 'failed'
    and updated_at > now() - interval '1 hour';

  -- Check storage growth (last 24h)
  select coalesce(sum(size_bytes), 0) into v_storage_growth
  from public.files
  where status = 'uploaded'
    and created_at > now() - interval '24 hours';

  -- Check payment silence (last webhook > 48h?)
  select extract(hours from now() - max(created_at))::int into v_payment_silence_hours
  from public.payments
  where created_at > now() - interval '7 days';

  -- Insert system alert if needed
  if v_upload_failures > 10 then
    insert into public.system_alerts (type, severity, message, metadata)
    values ('upload_failure', 'warning',
      v_upload_failures || ' uploads échoués dans la dernière heure',
      jsonb_build_object('count', v_upload_failures));
  end if;

  if v_payment_silence_hours > 48 then
    insert into public.system_alerts (type, severity, message, metadata)
    values ('payment_silence', 'info',
      'Aucun paiement reçu depuis ' || v_payment_silence_hours || ' heures',
      jsonb_build_object('silence_hours', v_payment_silence_hours));
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('auto-health-check', '0 * * * *', 'select public.auto_health_check();');
  end if;
end;
$$;
