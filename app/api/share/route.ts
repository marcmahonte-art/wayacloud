import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { isRateLimited } from "@/lib/rateLimit"
import {
  createShareToken,
  getShareExpiresAt,
  hashShareToken,
  type ShareExpiration,
} from "@/lib/share"

const shareSchema = z.object({
  fileId: z.string().uuid(),
  maxDownloads: z.number().int().positive().max(100).default(10),
  expiresIn: z.enum(["1h", "24h", "1d", "7d", "30d", "never"]).default("7d"),
  linkType: z.enum(["public", "private"]).default("public"),
  permission: z.enum(["view", "download", "edit"]).default("download"),
})

export async function POST(request: Request) {
  const authSupabase = createServerSupabaseClient()
  const { data: { user }, error: userError } = await authSupabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: "Configuration serveur incomplète." }, { status: 500 })
  }

  const body = shareSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 })
  }

  const { fileId, maxDownloads, expiresIn, linkType, permission } = body.data
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local"
  const rateLimitKey = `${user.id}:${forwardedFor.split(",")[0]?.trim() ?? "local"}`

  if (isRateLimited(`share:${rateLimitKey}`, 20, 3600000)) {
    return NextResponse.json(
      { message: "Trop de liens créés. Limite: 20/heure." },
      { status: 429 },
    )
  }

  const supabase = createAdminSupabaseClient()

  const { data: file } = await supabase
    .from("files")
    .select("id, owner_id")
    .eq("id", fileId)
    .eq("is_trashed", false)
    .single()

  if (!file) {
    return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 })
  }

  if (file.owner_id !== user.id) {
    return NextResponse.json({ message: "Vous n'êtes pas propriétaire de ce fichier." }, { status: 403 })
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, is_active, is_trial")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  const { data: plan } = await supabase
    .from("storage_plans")
    .select("name, monthly_price_fcfa")
    .eq("id", sub?.plan_id ?? "")
    .maybeSingle()

  const isOnFreeTier = !sub || sub.is_trial || !plan || plan.monthly_price_fcfa === 0 || plan.name === "Gratuit"

  if (isOnFreeTier) {
    const now = new Date().toISOString()
    const { count } = await supabase
      .from("share_links")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt.${now}`)

    if (count && count >= 5) {
      return NextResponse.json(
        { message: "Limite de 5 liens actifs. Passez à un plan supérieur." },
        { status: 403 },
      )
    }
  }

  const { data: fileData } = await supabase
    .from("files")
    .select("id, name, mime_type, size_bytes")
    .eq("id", fileId)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const token = createShareToken()
  const tokenHash = hashShareToken(token)
  const expiresAt = getShareExpiresAt(expiresIn as ShareExpiration)

  const { error: insertError } = await supabase.from("share_links").insert({
    file_id: fileId,
    owner_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    max_downloads: maxDownloads,
    download_count: 0,
    link_type: linkType,
    permission,
  })

  if (insertError) {
    console.error("Insert share link error:", insertError)
    return NextResponse.json({ message: "Erreur de création du lien." }, { status: 500 })
  }

  await supabase.rpc("insert_activity", {
    p_user_id: user.id,
    p_type: "share",
    p_title: `${fileData?.name || "Fichier"} partagé`,
    p_description: `Lien de partage créé (${maxDownloads} téléchargements max)`,
    p_metadata: JSON.stringify({
      file_id: fileId,
      file_name: fileData?.name,
      max_downloads: maxDownloads,
      expires_in: expiresIn,
      link_type: linkType,
      permission,
    }),
  })

  return NextResponse.json({
    shareUrl: `${request.headers.get("origin") || "https://wayacloud.bf"}/s/${token}`,
    token,
    file: fileData ? { name: fileData.name, mimeType: fileData.mime_type, sizeBytes: fileData.size_bytes } : null,
    owner: profile ? { name: profile.full_name } : null,
    expiresAt,
    maxDownloads,
    linkType,
    permission,
  })
}
