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
  const status = searchParams.get("status") || ""
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("payments")
    .select("id, user_id, subscription_id, amount_fcfa, status, cinetpay_transaction_id, is_gift, created_at", { count: "exact" })

  if (status) query = query.eq("status", status)
  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = Array.from(new Set((data ?? []).map(p => p.user_id)))
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const payments = (data ?? []).map(p => ({
    ...p,
    user: profileMap.get(p.user_id) || null,
  }))

  const { data: allPayments } = await supabase.from("payments").select("amount_fcfa, status, created_at")

  const totalRevenue = allPayments?.filter(p => p.status === "completed").reduce((s, p) => s + p.amount_fcfa, 0) ?? 0
  const monthlyRevenue = allPayments
    ?.filter(p => p.status === "completed" && new Date(p.created_at) > new Date(Date.now() - 30 * 86400000))
    .reduce((s, p) => s + p.amount_fcfa, 0) ?? 0
  const failedCount = allPayments?.filter(p => p.status === "failed" || p.status === "expired").length ?? 0
  const pendingCount = allPayments?.filter(p => p.status === "pending").length ?? 0

  return NextResponse.json({
    payments,
    total: count ?? 0,
    page,
    pageSize,
    stats: {
      totalRevenue,
      monthlyRevenue,
      failedCount,
      pendingCount,
    },
  })
}
