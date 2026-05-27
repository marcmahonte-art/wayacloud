import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const { data, error } = await supabase
    .from("files")
    .select("id, name, mime_type, size_bytes, checksum_sha256, status, is_trashed, trashed_at, is_favorite, color_label, parent_id, object_key, created_at, updated_at")
    .eq("owner_id", user.id)
    .eq("is_trashed", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const copySchema = z.object({
  fileId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const body = copySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ message: "Données invalides." }, { status: 400 });

  const { data: source } = await supabase
    .from("files")
    .select("*")
    .eq("id", body.data.fileId)
    .eq("owner_id", user.id)
    .single();

  if (!source) return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });

  const { data: newFile, error } = await supabase
    .from("files")
    .insert({
      owner_id: user.id,
      bucket: source.bucket,
      object_key: `copies/${user.id}/${Date.now()}_${source.name}`,
      name: `Copie - ${source.name}`,
      mime_type: source.mime_type,
      size_bytes: source.size_bytes,
      checksum_sha256: source.checksum_sha256,
      status: "uploaded",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(newFile);
}
