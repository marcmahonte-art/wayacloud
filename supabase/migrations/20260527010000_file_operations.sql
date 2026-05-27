-- ============================================================
-- Add file operation columns + folders table
-- ============================================================

-- 1. Add columns for file management
alter table public.files
  add column if not exists is_favorite boolean not null default false,
  add column if not exists color_label text check (color_label in (
    'red','orange','yellow','green','blue','purple','pink','gray'
  )),
  add column if not exists parent_id uuid references public.files(id) on delete set null;

-- 2. Enable auth to manage own files (already exists but ensure)
drop policy if exists "files_manage_own" on public.files;
create policy "files_manage_own"
on public.files for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- 3. Allow selecting files by id for share-owner checks etc
create index if not exists files_id_owner_idx on public.files (id, owner_id);
create index if not exists files_parent_id_idx on public.files (parent_id);
