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

  // Interroger la vue d'agrégation SQL pré-calculée dashboard_metrics
  const { data: metrics, error: metricsErr } = await supabase
    .from("dashboard_metrics")
    .select("*")
    .limit(1)
    .maybeSingle()

  if (metricsErr) {
    return NextResponse.json({ error: metricsErr.message }, { status: 500 })
  }

  // Si la vue n'a pas encore de données ou renvoie null, on prend des fallbacks à 0
  const m = metrics || {
    total_users: 0,
    new_users_week: 0,
    new_users_today: 0,
    total_files: 0,
    today_uploads: 0,
    total_storage_bytes: 0,
    total_limit_bytes: 0,
    monthly_revenue: 0,
    total_revenue: 0,
    failed_payments: 0,
    premium_subscribers: 0,
    trial_users: 0,
    total_active_subscriptions: 0,
    total_ai_requests: 0,
    whatsapp_protected_users: 0,
  }

  // Répartition par type de fichier via des requêtes SQL count ciblées (Promises parallèles)
  const [imagesCount, videosCount, audiosCount, pdfsCount, totalFilesCount] = await Promise.all([
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_trashed", false).ilike("mime_type", "image/%"),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_trashed", false).ilike("mime_type", "video/%"),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_trashed", false).ilike("mime_type", "audio/%"),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_trashed", false).or("mime_type.ilike.application/pdf,name.ilike.%.pdf"),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_trashed", false),
  ])

  const imgs = imagesCount.count ?? 0
  const vids = videosCount.count ?? 0
  const auds = audiosCount.count ?? 0
  const pdfs = pdfsCount.count ?? 0
  const totalF = totalFilesCount.count ?? 0
  const others = Math.max(0, totalF - (imgs + vids + auds + pdfs))

  const typeDistribution = {
    images: imgs,
    videos: vids,
    audios: auds,
    pdfs: pdfs,
    others: others,
  }

  // Top stockage (limité à 10 par la base de données)
  const topUsers = await supabase
    .from("storage_quotas")
    .select("user_id, storage_used_bytes")
    .order("storage_used_bytes", { ascending: false })
    .limit(10)

  // Plus gros fichiers (limité à 10 par la base de données)
  const largestFiles = await supabase
    .from("files")
    .select("id, name, size_bytes, mime_type, owner_id, created_at")
    .eq("is_trashed", false)
    .order("size_bytes", { ascending: false })
    .limit(10)

  const totalUsers = m.total_users
  const totalStorageBytes = Number(m.total_storage_bytes)
  const totalLimitBytes = Number(m.total_limit_bytes)

  // Activités récentes d'upload sur les 90 derniers jours (limitée aux 500 dernières lignes pour éviter les crashs)
  const storageGrowth = await supabase
    .from("activities")
    .select("created_at, metadata")
    .eq("type", "upload")
    .gte("created_at", new Date(now.getTime() - 90 * 86400000).toISOString())
    .order("created_at", { ascending: true })
    .limit(500)

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
      newThisWeek: m.new_users_week,
      todayActive: m.new_users_today,
      premiumSubscribers: m.premium_subscribers,
      trialUsers: m.trial_users,
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
      total: totalF,
      todayUploads: m.today_uploads,
      typeDistribution,
    },
    revenue: {
      monthly: m.monthly_revenue,
      total: m.total_revenue,
      monthlyFormatted: `${(m.monthly_revenue).toLocaleString()} FCFA`,
      totalFormatted: `${(m.total_revenue).toLocaleString()} FCFA`,
      failedPayments: m.failed_payments,
    },
    subscriptions: {
      active: m.total_active_subscriptions,
      premium: m.premium_subscribers,
      trial: m.trial_users,
    },
    ai: {
      totalRequests: m.total_ai_requests,
    },
    whatsapp: {
      totalProtected: m.whatsapp_protected_users,
    },
    growth: {
      dailyUploads,
      dailyStorage,
    },
    health: "healthy",
  })
}
