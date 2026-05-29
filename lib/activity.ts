import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function logActivity(params: {
  userId: string
  type: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = createAdminSupabaseClient()
    await supabase.rpc("insert_activity", {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_description: params.description || null,
      p_metadata: params.metadata ? JSON.stringify(params.metadata) : "{}",
    })
  } catch {
    // Ne pas bloquer l'action principale si l'activité échoue
  }
}
