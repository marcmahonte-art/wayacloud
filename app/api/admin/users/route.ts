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
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")))
  const search = searchParams.get("search") || ""
  const role = searchParams.get("role") || ""
  const sortBy = searchParams.get("sortBy") || "created_at"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("profiles")
    .select("id, email, first_name, last_name, full_name, phone, city, role, created_at, updated_at", { count: "exact" })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (role) {
    query = query.eq("role", role)
  }

  const { data, error, count } = await query
    .order(sortBy as any, { ascending: sortOrder === "asc" })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = (data ?? []).map(p => p.id)

  const [subsRes, quotasRes, filesRes] = await Promise.all([
    supabase.from("subscriptions").select("user_id, plan_id, is_active, is_trial").in("user_id", userIds),
    supabase.from("storage_quotas").select("user_id, storage_used_bytes, storage_limit_bytes").in("user_id", userIds),
    supabase.from("files").select("owner_id, id", { count: "exact", head: true }).in("owner_id", userIds).eq("is_trashed", false),
  ])

  const subsByUser = new Map((subsRes.data ?? []).map(s => [s.user_id, s]))
  const quotasByUser = new Map((quotasRes.data ?? []).map(q => [q.user_id, q]))

  const users = (data ?? []).map(p => ({
    ...p,
    subscription: subsByUser.get(p.id) || null,
    quota: quotasByUser.get(p.id) || null,
  }))

  return NextResponse.json({ users, total: count ?? 0, page, pageSize })
}

export async function PATCH(request: Request) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const supabase = createAdminSupabaseClient()
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, action, value } = body

  if (!userId || !action) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  switch (action) {
    case "suspend": {
      await supabase.from("profiles").update({ role: "suspended" as any }).eq("id", userId)
      break
    }
    case "reactivate": {
      await supabase.from("profiles").update({ role: "user" }).eq("id", userId)
      break
    }
    case "changeRole": {
      if (["user", "admin", "super_admin"].includes(value)) {
        await supabase.from("profiles").update({ role: value }).eq("id", userId)
      }
      break
    }
    case "updateQuota": {
      await supabase.from("storage_quotas").update({ storage_limit_bytes: value }).eq("user_id", userId)
      break
    }
    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: `user_${action}`,
    target_table: "profiles",
    target_id: userId,
    metadata: { action, value },
  })

  return NextResponse.json({ success: true })
}
