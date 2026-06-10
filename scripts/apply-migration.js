require('dotenv').config()
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uxwjvlbtmhvkgvfrdxdr.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Check what rpc functions exist
  console.log("Checking existing RPC functions...")
  const checkRpc = await supabase.rpc("exec_sql", { query: "SELECT 1" })
  console.log("exec_sql exists:", !checkRpc.error, checkRpc.error?.message || "")

  // Try to create the exec_sql function first if it doesn't exist
  if (checkRpc.error) {
    console.log("Creating exec_sql function...")
    const createFn = await fetch("https://uxwjvlbtmhvkgvfrdxdr.supabase.co/rest/v1/rpc/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
    })
  }

  // Try directly creating SQL via management API
  // Use the existing migrate approach
  const fullSQL = `
create or replace view public.dashboard_metrics as
select
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.profiles where created_at > now() - interval '7 days') as new_users_week,
  (select count(*) from public.files where is_trashed = false) as total_files,
  (select count(*) from public.files where is_trashed = false and created_at > current_date) as today_uploads,
  (select coalesce(sum(storage_used_bytes), 0) from public.storage_quotas) as total_storage_bytes,
  (select coalesce(sum(storage_limit_bytes), 0) from public.storage_quotas) as total_limit_bytes,
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'completed') as total_revenue,
  (select coalesce(sum(amount_fcfa), 0) from public.payments where status = 'completed' and created_at > now() - interval '30 days') as monthly_revenue,
  (select count(*) from public.subscriptions where is_active = true and is_trial = false) as premium_subscribers,
  (select count(*) from public.subscriptions where is_trial = true) as trial_users,
  (select count(*) from public.ai_events) as total_ai_requests;

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
insert into public.system_health (service, status, latency_ms) values
  ('database', 'healthy', 12), ('storage', 'healthy', 84),
  ('api', 'healthy', 23), ('ai', 'healthy', 145),
  ('cinetpay', 'healthy', 210), ('whatsapp', 'healthy', 67)
on conflict (service) do nothing;

alter publication supabase_realtime add table if not exists public.system_alerts;
alter publication supabase_realtime add table if not exists public.system_health;
alter publication supabase_realtime add table if not exists public.payments;
alter publication supabase_realtime add table if not exists public.profiles;

create or replace function public.log_admin_action(
  p_admin_id uuid, p_action text, p_target_table text, p_target_id text,
  p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer as $$
begin
  insert into public.admin_audit_logs (admin_id, action, target_table, target_id, metadata)
  values (p_admin_id, p_action, p_target_table, p_target_id, p_metadata);
end;
$$;

create or replace function public.alert_payment_failures()
returns trigger language plpgsql security definer as $$
declare recent_failures int;
begin
  if new.status = 'failed' then
    select count(*) into recent_failures from public.payments
    where status = 'failed' and created_at > now() - interval '1 hour';
    if recent_failures >= 3 then
      insert into public.system_alerts (alert_type, severity, message, metadata)
      values ('payment_failure_rate', 'warning',
        'Plus de ' || recent_failures || ' paiements echoues dans la derniere heure.',
        jsonb_build_object('failed_count', recent_failures, 'last_payment_id', new.id));
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_alert_payment_failures on public.payments;
create trigger trg_alert_payment_failures
  after insert on public.payments
  for each row execute function public.alert_payment_failures();

create or replace function public.alert_signup_surge()
returns trigger language plpgsql security definer as $$
declare signups_last_hour int; signups_yesterday_same_hour int;
begin
  select count(*) into signups_last_hour from public.profiles
  where created_at > now() - interval '1 hour';
  select count(*) into signups_yesterday_same_hour from public.profiles
  where created_at > now() - interval '25 hours' and created_at <= now() - interval '24 hours';
  if signups_last_hour > signups_yesterday_same_hour * 3 and signups_last_hour >= 10 then
    insert into public.system_alerts (alert_type, severity, message, metadata)
    values ('signup_surge', 'info',
      'Pic d inscriptions : ' || signups_last_hour || ' dans la derniere heure.',
      jsonb_build_object('signups_last_hour', signups_last_hour, 'signups_yesterday_same_hour', signups_yesterday_same_hour));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_alert_signup_surge on public.profiles;
create trigger trg_alert_signup_surge
  after insert on public.profiles
  for each row execute function public.alert_signup_surge();
`

  console.log("Executing migration SQL...")
  // Try via the raw pg endpoint
  const res = await fetch("https://uxwjvlbtmhvkgvfrdxdr.supabase.co/auth/v1/admin/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: fullSQL })
  })
  console.log("Status:", res.status)
  const text = await res.text()
  console.log("Response:", text.substring(0, 500))

  // Verify the view and table were created
  console.log("\nVerifying...")
  const r1 = await fetch("https://uxwjvlbtmhvkgvfrdxdr.supabase.co/rest/v1/dashboard_metrics?limit=1", {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  })
  console.log("dashboard_metrics:", r1.status, r1.ok ? JSON.stringify(await r1.json()) : "")

  const r2 = await fetch("https://uxwjvlbtmhvkgvfrdxdr.supabase.co/rest/v1/system_health", {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  })
  console.log("system_health:", r2.status, r2.ok ? JSON.stringify(await r2.json()) : "")
}

main().catch(console.error)
