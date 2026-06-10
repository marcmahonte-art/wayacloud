import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getWasabiClient, getWasabiBucket } from "@/lib/wasabi"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createHash } from "crypto"
import { hashShareToken, isShareExpired } from "@/lib/share"

export async function POST(request: Request) {
  const { token } = await request.json() as { token?: string }
  if (!token) {
    return NextResponse.json({ message: "Token requis." }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  const tokenHash = hashShareToken(token)

  const { data: link } = await supabase
    .from("share_links")
    .select("id, file_id, expires_at, max_downloads, download_count, revoked_at, link_type, permission")
    .or(`token_hash.eq.${tokenHash},token_hash.eq.${token}`)
    .single()

  if (!link) {
    return NextResponse.json({ message: "Lien introuvable." }, { status: 404 })
  }

  if (link.revoked_at) {
    return NextResponse.json({ message: "Ce lien a été révoqué." }, { status: 403 })
  }

  if (isShareExpired(link.expires_at)) {
    return NextResponse.json({ message: "Ce lien a expiré." }, { status: 410 })
  }

  if (link.link_type === "private") {
    const authSupabase = createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: "Connexion requise pour ce lien privé." }, { status: 401 })
    }
  }

  if (link.permission === "view") {
    return NextResponse.json({ message: "Ce lien autorise uniquement la consultation." }, { status: 403 })
  }

  if (link.download_count >= link.max_downloads) {
    return NextResponse.json({ message: "Limite de téléchargements atteinte." }, { status: 410 })
  }

  const { data: file } = await supabase
    .from("files")
    .select("object_key, name, mime_type, is_trashed")
    .eq("id", link.file_id)
    .single()

  if (!file || file.is_trashed) {
    return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 })
  }

  const client = getWasabiClient()
  const command = new GetObjectCommand({
    Bucket: getWasabiBucket(),
    Key: file.object_key,
    ResponseContentDisposition: `attachment; filename="${file.name.replace(/"/g, "")}"`,
  })
  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 })

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown"
  const ipHash = createHash("sha256").update(forwardedFor).digest("hex").slice(0, 16)

  await supabase.from("download_logs").insert({
    share_link_id: link.id,
    ip_hash: ipHash,
  })

  await supabase
    .from("share_links")
    .update({ download_count: link.download_count + 1 })
    .eq("id", link.id)

  return NextResponse.json({ url: presignedUrl, fileName: file.name, mimeType: file.mime_type })
}
