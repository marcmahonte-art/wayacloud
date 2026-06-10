import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { generatePresignedGet } from "@/lib/wasabi"

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "24", 10)))
  const category = searchParams.get("category") || ""
  const search = searchParams.get("search") || ""
  const trashed = searchParams.get("trashed") === "true"
  const sortBy = searchParams.get("sortBy") || "created_at"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const admin = createAdminSupabaseClient()
  let query = admin
    .from("files")
    .select("id, name, mime_type, size_bytes, checksum_sha256, status, is_trashed, trashed_at, is_favorite, color_label, parent_id, object_key, created_at, updated_at", { count: "exact" })
    .eq("owner_id", user.id)

  if (trashed) {
    query = query.eq("is_trashed", true).neq("status", "deleted")
  } else {
    query = query.eq("is_trashed", false)
  }

  if (category) {
    if (category === "images") query = query.ilike("mime_type", "image/%")
    else if (category === "videos") query = query.ilike("mime_type", "video/%")
    else if (category === "audios") query = query.ilike("mime_type", "audio/%")
    else if (category === "pdfs") query = query.or("mime_type.ilike.application/pdf,name.ilike.%.pdf")
    else if (category === "documents") query = query.or("mime_type.ilike.application/msword,mime_type.ilike.application/vnd.openxmlformats-officedocument.wordprocessingml.document,mime_type.ilike.text/plain,mime_type.ilike.application/vnd.ms-excel")
    else if (category === "archives") query = query.or("name.ilike.%.zip,name.ilike.%.rar,name.ilike.%.7z,name.ilike.%.tar.gz,name.ilike.%.gz")
  }

  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const files = await Promise.all(
    (data ?? []).map(async (file: any) => ({
      ...file,
      url: file.object_key ? await generatePresignedGet(file.object_key).catch(() => "") : "",
    })),
  )

  return NextResponse.json({
    files,
    total: count ?? 0,
    page,
    pageSize,
    hasMore: (from + pageSize) < (count ?? 0),
  })
}
