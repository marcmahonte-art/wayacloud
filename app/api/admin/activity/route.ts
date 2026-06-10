import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const supabase = createAdminSupabaseClient()
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "30")))
  const type = searchParams.get("type") || ""
  const search = searchParams.get("search") || ""
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("activities")
    .select("id, user_id, type, title, description, metadata, created_at", { count: "exact" })

  if (type) query = query.eq("type", type)
  if (search) query = query.ilike("title", `%${search}%`)
  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = Array.from(new Set((data ?? []).map(a => a.user_id)))
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const activities = (data ?? []).map(a => ({
    ...a,
    user: profileMap.get(a.user_id) || null,
  }))

  const typeStats = await supabase.rpc("get_activity_type_stats" as any)

  return NextResponse.json({
    activities,
    total: count ?? 0,
    page,
    pageSize,
    typeStats: typeStats.data ?? null,
  })
}
