import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ message: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  // Get Gratuit plan id
  const { data: freePlan } = await supabase
    .from("storage_plans")
    .select("id, storage_go")
    .eq("name", "Gratuit")
    .eq("is_active", true)
    .single();

  if (!freePlan) {
    return NextResponse.json({ message: "Plan Gratuit introuvable." }, { status: 500 });
  }

  const freePlanStorageBytes = freePlan.storage_go * 1024 * 1024 * 1024;

  // Find users on Essentiel trial with <= 5GB quota (should be on Gratuit)
  const { data: toFix } = await supabase
    .from("subscriptions")
    .select(`
      id, user_id, plan_id,
      storage_quotas!inner(storage_limit_bytes)
    `)
    .eq("is_active", true)
    .not("plan_id", "eq", freePlan.id)
    .lte("storage_quotas.storage_limit_bytes", freePlanStorageBytes);

  let fixed = 0;
  if (toFix) {
    for (const sub of toFix) {
      await supabase
        .from("subscriptions")
        .update({
          plan_id: freePlan.id,
          is_trial: false,
          trial_ends_at: null,
          ends_at: null,
        })
        .eq("id", sub.id);

      await supabase
        .from("storage_quotas")
        .update({ storage_limit_bytes: freePlanStorageBytes })
        .eq("user_id", sub.user_id);

      await supabase.rpc("insert_activity", {
        p_user_id: sub.user_id,
        p_type: "subscription",
        p_title: "Plan mis à jour vers Gratuit",
        p_description: "Correction automatique : le plan Essentiel ne correspondait pas au quota",
        p_metadata: JSON.stringify({ previous_plan_id: sub.plan_id }),
      });

      fixed++;
    }
  }

  // Also fix current user if needed
  const { data: mySub } = await supabase
    .from("subscriptions")
    .select("id, plan_id, is_trial")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (mySub && mySub.plan_id !== freePlan.id && mySub.is_trial) {
    const { data: myQuota } = await supabase
      .from("storage_quotas")
      .select("storage_limit_bytes")
      .eq("user_id", user.id)
      .single();

    if (myQuota && myQuota.storage_limit_bytes <= freePlanStorageBytes) {
      await supabase
        .from("subscriptions")
        .update({ plan_id: freePlan.id, is_trial: false, trial_ends_at: null, ends_at: null })
        .eq("id", mySub.id);
      fixed++;
    }
  }

  return NextResponse.json({ fixed, message: `${fixed} abonnement(s) corrigé(s) vers le plan Gratuit.` });
}
