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

  const [filesRes, quotasRes] = await Promise.all([
    supabase.from("files").select("id, name, size_bytes, mime_type, owner_id, created_at, is_trashed").eq("is_trashed", false).order("size_bytes", { ascending: false }),
    supabase.from("storage_quotas").select("user_id, storage_used_bytes, storage_limit_bytes"),
  ])

  const files = filesRes.data ?? []
  const quotas = quotasRes.data ?? []

  const totalUsed = quotas.reduce((s, q) => s + Number(q.storage_used_bytes), 0)
  const totalLimit = quotas.reduce((s, q) => s + Number(q.storage_limit_bytes), 0)
  const avgUsed = quotas.length > 0 ? Math.round(totalUsed / quotas.length) : 0

  const byType: Record<string, { count: number; bytes: number }> = {}
  for (const f of files) {
    const cat = f.mime_type?.startsWith("image/") ? "images"
      : f.mime_type?.startsWith("video/") ? "videos"
      : f.mime_type?.startsWith("audio/") ? "audios"
      : f.mime_type?.includes("pdf") ? "pdfs"
      : f.mime_type?.includes("zip") || f.mime_type?.includes("rar") ? "archives"
      : "others"
    if (!byType[cat]) byType[cat] = { count: 0, bytes: 0 }
    byType[cat].count++
    byType[cat].bytes += Number(f.size_bytes)
  }

  const topUsers = [...quotas]
    .sort((a, b) => Number(b.storage_used_bytes) - Number(a.storage_used_bytes))
    .slice(0, 20)
    .map(q => ({
      userId: q.user_id,
      usedBytes: Number(q.storage_used_bytes),
      limitBytes: Number(q.storage_limit_bytes),
      usedFormatted: `${(Number(q.storage_used_bytes) / (1024 ** 3)).toFixed(1)} Go`,
      limitFormatted: `${(Number(q.storage_limit_bytes) / (1024 ** 3)).toFixed(1)} Go`,
    }))

  const largestFiles = files.slice(0, 20).map(f => ({
    id: f.id,
    name: f.name,
    sizeBytes: Number(f.size_bytes),
    sizeFormatted: `${(Number(f.size_bytes) / (1024 ** 3)).toFixed(1)} Go`,
    type: f.mime_type,
    ownerId: f.owner_id,
    createdAt: f.created_at,
  }))

  return NextResponse.json({
    totalUsed,
    totalLimit,
    totalUsedFormatted: `${(totalUsed / (1024 ** 4)).toFixed(1)} To`,
    totalLimitFormatted: `${(totalLimit / (1024 ** 4)).toFixed(1)} To`,
    usagePercent: totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0,
    averagePerUser: avgUsed,
    averageFormatted: `${(avgUsed / (1024 ** 3)).toFixed(1)} Go`,
    fileCount: files.length,
    byType,
    topUsers,
    largestFiles,
  })
}
