import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const admin = createAdminSupabaseClient()

    const { error: filesError } = await admin
      .from("files")
      .delete()
      .eq("owner_id", user.id)
    if (filesError) throw filesError

    const { error: quotaError } = await admin
      .from("storage_quotas")
      .delete()
      .eq("user_id", user.id)
    if (quotaError) throw quotaError

    const { error: subscriptionError } = await admin
      .from("subscriptions")
      .delete()
      .eq("user_id", user.id)
    if (subscriptionError) throw subscriptionError

    const { error: shareError } = await admin
      .from("share_links")
      .delete()
      .eq("user_id", user.id)
    if (shareError) throw shareError

    const { error: activityError } = await admin
      .from("activities")
      .delete()
      .eq("user_id", user.id)
    if (activityError) throw activityError

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", user.id)
    if (profileError) throw profileError

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete account error:", err)
    return NextResponse.json({ error: "Erreur lors de la suppression du compte" }, { status: 500 })
  }
}
