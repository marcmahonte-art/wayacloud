import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const checkSchema = z.object({
  md5: z.string().regex(/^[a-f0-9]{32}$/),
});

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const body = checkSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ message: "MD5 invalide." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("files")
    .select("id, name, size, mime_type, s3_key, category, created_at")
    .eq("md5", body.data.md5)
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      duplicate: true,
      file: {
        id: existing.id,
        name: existing.name,
        size: existing.size,
        mimeType: existing.mime_type,
        category: existing.category,
        uploadedAt: existing.created_at,
      },
    });
  }

  return NextResponse.json({ duplicate: false });
}
