import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const [
    { data: files, error: filesError },
    { data: profile },
    { data: quota },
  ] = await Promise.all([
    supabase
      .from("files")
      .select("id, name, size, mime_type, s3_key, category, md5, source, created_at")
      .eq("user_id", user.id)
      .eq("source", "whatsapp")
      .neq("status", "deleted")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("last_whatsapp_backup")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("storage_quotas")
      .select("storage_used_bytes, storage_limit_bytes")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (filesError) {
    return NextResponse.json({ message: "Erreur lors de la récupération des sauvegardes." }, { status: 500 });
  }

  const totalWhatsAppSize = files?.reduce((sum, f) => sum + (f.size ?? 0), 0) ?? 0;
  const fileCountByCategory: Record<string, number> = {};
  files?.forEach((f) => {
    const cat = f.category || "general";
    fileCountByCategory[cat] = (fileCountByCategory[cat] ?? 0) + 1;
  });

  return NextResponse.json({
    lastBackup: profile?.last_whatsapp_backup ?? null,
    totalFiles: files?.length ?? 0,
    totalSize: totalWhatsAppSize,
    storageUsed: quota?.storage_used_bytes ?? 0,
    storageLimit: quota?.storage_limit_bytes ?? 5_368_709_120,
    files: files ?? [],
    categories: fileCountByCategory,
  });
}
