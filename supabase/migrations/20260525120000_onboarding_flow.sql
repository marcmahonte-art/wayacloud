-- Make phone nullable for email-first signup
alter table public.profiles
  alter column phone drop not null;

-- Add new columns for onboarding
alter table public.profiles
  add column if not exists email text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists gender text;

alter table public.profiles
  drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check check (gender in ('homme', 'femme', 'autre'));

-- Relax city constraint (make it text)
alter table public.profiles
  alter column city type text using city::text,
  alter column city drop default;

alter table public.profiles
  drop constraint if exists profiles_city_check;

create index if not exists profiles_email_idx on public.profiles (email);

-- Storage quotas table
create table if not exists public.storage_quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  storage_limit_bytes bigint not null default 5368709120,
  storage_used_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add trial columns to subscriptions
alter table public.subscriptions
  add column if not exists is_trial boolean not null default false,
  add column if not exists trial_ends_at timestamptz;

-- Enable RLS on storage_quotas
alter table public.storage_quotas enable row level security;

-- RLS policies for storage_quotas
create policy "storage_quotas_select_own"
on public.storage_quotas for select
to authenticated
using (user_id = auth.uid());

create policy "storage_quotas_insert_own"
on public.storage_quotas for insert
to authenticated
with check (user_id = auth.uid());

create policy "storage_quotas_update_own"
on public.storage_quotas for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Trigger: auto-create profile + quota + trial on signup
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
begin
  _first_name := new.raw_user_meta_data ->> 'first_name';
  _last_name := new.raw_user_meta_data ->> 'last_name';
  _gender := new.raw_user_meta_data ->> 'gender';
  _city := new.raw_user_meta_data ->> 'city';
  _phone := new.raw_user_meta_data ->> 'phone';

  insert into public.profiles (id, email, first_name, last_name, full_name, gender, city, phone, role)
  values (
    new.id,
    new.email,
    _first_name,
    _last_name,
    coalesce(nullif(trim(_first_name || ' ' || coalesce(_last_name, '')), ''), split_part(new.email, '@', 1)),
    _gender,
    _city,
    _phone,
    'user'
  );

  insert into public.storage_quotas (user_id, storage_limit_bytes, storage_used_bytes)
  values (new.id, 5368709120, 0);

  insert into public.subscriptions (user_id, plan_id, starts_at, ends_at, is_active, is_trial, trial_ends_at)
  values (
    new.id,
    (select id from public.storage_plans where is_active = true order by monthly_price_fcfa asc limit 1),
    now(),
    now() + interval '45 days',
    true,
    true,
    now() + interval '45 days'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for storage_quotas
create trigger storage_quotas_set_updated_at
  before update on public.storage_quotas
  for each row execute function public.set_updated_at();
