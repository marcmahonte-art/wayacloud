import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const admin = createAdminSupabaseClient()
    await admin.rpc("insert_activity", {
      p_user_id: user.id,
      p_type: "login",
      p_title: "Connexion",
      p_description: "Utilisateur connecté",
      p_metadata: JSON.stringify({ email: user.email }),
    })
  } catch {
    // Silently fail - login tracking is non-critical
  }

  return NextResponse.json({ success: true })
}
