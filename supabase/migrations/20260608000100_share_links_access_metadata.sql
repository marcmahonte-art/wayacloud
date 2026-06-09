alter table public.share_links
  add column if not exists link_type text not null default 'public'
    check (link_type in ('public', 'private')),
  add column if not exists permission text not null default 'download'
    check (permission in ('view', 'download', 'edit'));

create index if not exists share_links_owner_active_idx
  on public.share_links (owner_id, revoked_at, expires_at);

drop policy if exists "share_links_manage_own" on public.share_links;
create policy "share_links_manage_own"
on public.share_links for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
