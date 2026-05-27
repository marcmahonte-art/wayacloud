-- Add avatar_url to profiles
alter table public.profiles
  add column if not exists avatar_url text;

-- Allow authenticated users to update their own avatar
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Create avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Allow authenticated users to upload their own avatar
drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  storage."filename"(name) like auth.uid() || '.%'
);

-- Allow anyone to read avatars
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Allow users to delete their own avatar
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' and
  storage."filename"(name) like auth.uid() || '.%'
);
