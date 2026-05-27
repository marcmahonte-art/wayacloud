alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by text;

create index if not exists idx_profiles_referral_code on public.profiles (referral_code);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  reward_days integer not null default 30,
  granted_at timestamptz,
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(referrer_id, referred_id)
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  max_uses integer not null default 1,
  used_count integer not null default 0,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.share_links
  add column if not exists max_downloads integer not null default 10,
  add column if not exists download_count integer not null default 0;

create table if not exists public.download_logs (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists is_gift boolean not null default false,
  add column if not exists gift_recipient_phone text,
  add column if not exists gift_message text,
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null;

create index if not exists idx_promo_codes_code on public.promo_codes (code);
create index if not exists idx_download_logs_share_link on public.download_logs (share_link_id);
create index if not exists idx_referral_rewards_referrer on public.referral_rewards (referrer_id);

alter table public.referral_rewards enable row level security;
alter table public.promo_codes enable row level security;
alter table public.download_logs enable row level security;

create policy "referral_rewards_select_own"
  on public.referral_rewards for select
  to authenticated
  using (referrer_id = auth.uid());

create policy "promo_codes_select_active"
  on public.promo_codes for select
  to authenticated
  using (is_active = true);

create policy "promo_codes_admin_all"
  on public.promo_codes for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

create policy "download_logs_insert"
  on public.download_logs for insert
  to anon
  with check (true);

create policy "download_logs_admin_select"
  on public.download_logs for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));

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
begin
  _first_name := new.raw_user_meta_data ->> 'first_name';
  _last_name := new.raw_user_meta_data ->> 'last_name';
  _gender := new.raw_user_meta_data ->> 'gender';
  _city := new.raw_user_meta_data ->> 'city';
  _phone := new.raw_user_meta_data ->> 'phone';
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

drop trigger if exists storage_quotas_set_updated_at on public.storage_quotas;
create trigger storage_quotas_set_updated_at
  before update on public.storage_quotas
  for each row execute function public.set_updated_at();
