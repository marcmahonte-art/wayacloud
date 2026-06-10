import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const supabase = createAdminSupabaseClient()

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()

  const [usersRes, filesRes, storageRes, paymentsRes, subsRes, activitiesRes, aiRes, whatsappRes] = await Promise.all([
    supabase.from("profiles").select("id, role, created_at", { count: "exact" }),
    supabase.from("files").select("id, size_bytes, mime_type, created_at, is_trashed", { count: "exact" }).eq("is_trashed", false),
    supabase.from("storage_quotas").select("storage_used_bytes, storage_limit_bytes"),
    supabase.from("payments").select("id, amount_fcfa, status, created_at"),
    supabase.from("subscriptions").select("id, plan_id, is_active, is_trial, user_id, plan_id"),
    supabase.from("activities").select("id, type, created_at").gte("created_at", todayStart),
    supabase.from("ai_events").select("id, action, created_at"),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_trashed", false).ilike("mime_type", "image/%"),
  ])

  const totalUsers = usersRes.count ?? 0
  const users = usersRes.data ?? []

  const newUsersThisWeek = users.filter(u => u.created_at >= weekStart).length
  const todayLogins = users.filter(u => u.created_at >= todayStart).length

  const premiumSubs = subsRes.data?.filter(s => s.is_active && !s.is_trial) ?? []
  const trialUsers = subsRes.data?.filter(s => s.is_trial) ?? []

  const totalFiles = filesRes.count ?? 0
  const totalStorageBytes = storageRes.data?.reduce((s, q) => s + Number(q.storage_used_bytes), 0) ?? 0
  const totalLimitBytes = storageRes.data?.reduce((s, q) => s + Number(q.storage_limit_bytes), 0) ?? 0

  const todayUploads = filesRes.data?.filter(f => f.created_at >= todayStart).length ?? 0

  const payments = paymentsRes.data ?? []
  const monthlyRevenue = payments
    .filter(p => p.status === "completed" && new Date(p.created_at) > new Date(now.getTime() - 30 * 86400000))
    .reduce((s, p) => s + p.amount_fcfa, 0)
  const totalRevenue = payments
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + p.amount_fcfa, 0)

  const totalAiRequests = aiRes.data?.length ?? 0

  const topUsers = await supabase
    .from("storage_quotas")
    .select("user_id, storage_used_bytes")
    .order("storage_used_bytes", { ascending: false })
    .limit(10)

  const largestFiles = await supabase
    .from("files")
    .select("id, name, size_bytes, mime_type, owner_id, created_at")
    .eq("is_trashed", false)
    .order("size_bytes", { ascending: false })
    .limit(10)

  const typeDistribution = (filesRes.data ?? []).reduce<Record<string, number>>((acc, f) => {
    const cat = f.mime_type?.startsWith("image/") ? "images"
      : f.mime_type?.startsWith("video/") ? "videos"
      : f.mime_type?.startsWith("audio/") ? "audios"
      : f.mime_type?.includes("pdf") ? "pdfs"
      : "others"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const totalWhatsApp = whatsappRes.count ?? 0

  const activeSubsCount = subsRes.data?.filter(s => s.is_active).length ?? 0
  const failedPayments = payments.filter(p => p.status === "failed" || p.status === "expired").length

  const storageGrowth = await supabase
    .from("activities")
    .select("created_at, metadata")
    .eq("type", "upload")
    .gte("created_at", new Date(now.getTime() - 90 * 86400000).toISOString())
    .order("created_at", { ascending: true })

  const dailyUploads: Record<string, number> = {}
  const dailyStorage: Record<string, number> = {}
  for (const a of storageGrowth.data ?? []) {
    const day = a.created_at?.split("T")[0]
    if (day) {
      dailyUploads[day] = (dailyUploads[day] || 0) + 1
      const size = typeof a.metadata === "object" && a.metadata ? Number((a.metadata as any).size || 0) : 0
      dailyStorage[day] = (dailyStorage[day] || 0) + size
    }
  }

  return NextResponse.json({
    users: {
      total: totalUsers,
      newThisWeek: newUsersThisWeek,
      todayActive: todayLogins,
      premiumSubscribers: premiumSubs.length,
      trialUsers: trialUsers.length,
    },
    storage: {
      totalBytes: totalStorageBytes,
      totalLimitBytes,
      totalFormatted: `${(totalStorageBytes / (1024 ** 4)).toFixed(1)} To`,
      usedPercent: totalLimitBytes > 0 ? Math.round((totalStorageBytes / totalLimitBytes) * 100) : 0,
      averagePerUser: totalUsers > 0 ? Math.round(totalStorageBytes / totalUsers) : 0,
      topUsers: (topUsers.data ?? []).map((u: any) => ({
        userId: u.user_id,
        usedBytes: Number(u.storage_used_bytes),
        usedFormatted: `${(Number(u.storage_used_bytes) / (1024 ** 3)).toFixed(1)} Go`,
      })),
      largestFiles: (largestFiles.data ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        sizeBytes: Number(f.size_bytes),
        sizeFormatted: `${(Number(f.size_bytes) / (1024 ** 3)).toFixed(1)} Go`,
        type: f.mime_type,
        ownerId: f.owner_id,
      })),
    },
    files: {
      total: totalFiles,
      todayUploads,
      typeDistribution,
    },
    revenue: {
      monthly: monthlyRevenue,
      total: totalRevenue,
      monthlyFormatted: `${(monthlyRevenue).toLocaleString()} FCFA`,
      totalFormatted: `${(totalRevenue).toLocaleString()} FCFA`,
      failedPayments,
    },
    subscriptions: {
      active: activeSubsCount,
      premium: premiumSubs.length,
      trial: trialUsers.length,
    },
    ai: {
      totalRequests: totalAiRequests,
    },
    whatsapp: {
      totalProtected: totalWhatsApp,
    },
    growth: {
      dailyUploads,
      dailyStorage,
    },
    health: "healthy",
  })
}
