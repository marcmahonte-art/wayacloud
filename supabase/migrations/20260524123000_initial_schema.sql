create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'admin', 'super_admin');
create type public.file_status as enum ('pending', 'uploaded', 'failed', 'deleted');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  full_name text,
  city text check (city in ('Bobo-Dioulasso', 'Koudougou', 'Ouagadougou')),
  role public.user_role not null default 'user',
  preferred_support_language text not null default 'moore',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.storage_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_go integer not null check (storage_go > 0),
  monthly_price_fcfa integer not null check (monthly_price_fcfa >= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.storage_plans(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null default 'wayacloud-storage',
  object_key text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text,
  status public.file_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, object_key)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  cinetpay_transaction_id text unique,
  amount_fcfa integer not null check (amount_fcfa between 100 and 50000),
  status public.payment_status not null default 'pending',
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_id uuid references public.files(id) on delete set null,
  action text not null check (action in ('summarize', 'chat')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index files_owner_id_created_at_idx on public.files (owner_id, created_at desc);
create index share_links_token_hash_idx on public.share_links (token_hash);
create index payments_user_id_created_at_idx on public.payments (user_id, created_at desc);
create index ai_events_user_id_created_at_idx on public.ai_events (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger files_set_updated_at
before update on public.files
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.storage_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.files enable row level security;
alter table public.share_links enable row level security;
alter table public.payments enable row level security;
alter table public.ai_events enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "storage_plans_select_active"
on public.storage_plans for select
to authenticated
using (is_active = true);

create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

create policy "files_manage_own"
on public.files for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "share_links_manage_own"
on public.share_links for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "payments_select_own"
on public.payments for select
to authenticated
using (user_id = auth.uid());

create policy "ai_events_insert_own"
on public.ai_events for insert
to authenticated
with check (user_id = auth.uid());

create policy "ai_events_select_own"
on public.ai_events for select
to authenticated
using (user_id = auth.uid());

create policy "admin_profiles_read"
on public.profiles for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

create policy "admin_subscriptions_read"
on public.subscriptions for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

create policy "admin_files_read"
on public.files for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

create policy "admin_payments_read"
on public.payments for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

create policy "super_admin_audit_read"
on public.admin_audit_logs for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

insert into public.storage_plans (name, storage_go, monthly_price_fcfa)
values
  ('Essentiel', 20, 1000),
  ('Famille', 100, 2500),
  ('Business', 500, 10000);
