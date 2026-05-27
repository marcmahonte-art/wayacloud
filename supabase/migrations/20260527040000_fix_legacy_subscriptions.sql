-- ============================================================
-- FIX: Legacy users assigned to Essentiel instead of Gratuit
-- ============================================================

do $$
declare
  v_free_plan_id uuid;
  v_free_storage_bytes bigint := 5368709120; -- 5GB
  v_count int := 0;
begin
  -- Get the Gratuit plan
  select id into v_free_plan_id
  from public.storage_plans
  where name = 'Gratuit' and is_active = true;

  if v_free_plan_id is null then
    raise notice 'Gratuit plan not found, skipping fix';
    return;
  end if;

  -- Fix subscriptions where user has <=5GB quota but is on a paid plan
  update public.subscriptions s
  set plan_id = v_free_plan_id,
      is_trial = false,
      trial_ends_at = null,
      ends_at = null
  from public.storage_quotas q
  where q.user_id = s.user_id
    and s.is_active = true
    and s.is_trial = true
    and s.plan_id != v_free_plan_id
    and q.storage_limit_bytes <= v_free_storage_bytes;

  get diagnostics v_count = row_count;
  raise notice 'Fixed % subscriptions', v_count;

  -- Log activities for fixed users
  insert into public.activities (user_id, type, title, description, metadata)
  select s.user_id, 'subscription', 'Plan mis à jour vers Gratuit',
         'Correction automatique : le plan payant ne correspondait pas au quota de stockage',
         jsonb_build_object('note', 'Legacy data fix')
  from public.subscriptions s
  where s.plan_id = v_free_plan_id
    and s.created_at = now();

exception when others then
  raise notice 'Error fixing subscriptions: %', sqlerrm;
end;
$$;
