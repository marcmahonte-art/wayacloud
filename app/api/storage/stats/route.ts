import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();

    const [quotaRes, filesRes] = await Promise.all([
      admin.from("storage_quotas").select("*").eq("user_id", user.id).maybeSingle(),
      admin.from("files").select("id, name, mime_type, size_bytes, status, created_at, object_key")
        .eq("owner_id", user.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false }),
    ]);

    const quota = quotaRes.data;
    const files = filesRes.data || [];

    const limitBytes = quota?.storage_limit_bytes ?? 5_368_709_120;
    const usedBytes = quota?.storage_used_bytes ?? files.reduce((sum, f) => sum + Number(f.size_bytes || 0), 0);
    const remainingBytes = Math.max(0, limitBytes - usedBytes);
    const usagePercent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

    const categories: Record<string, { count: number; bytes: number }> = {
      image: { count: 0, bytes: 0 },
      video: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      document: { count: 0, bytes: 0 },
      whatsapp: { count: 0, bytes: 0 },
    };

    for (const f of files) {
      const mime = (f.mime_type || "").toLowerCase();
      let cat = "document";
      if (mime.startsWith("image/")) cat = "image";
      else if (mime.startsWith("video/")) cat = "video";
      else if (mime.startsWith("audio/")) cat = "audio";
      else if (mime.includes("whatsapp") || f.object_key?.includes("whatsapp")) cat = "whatsapp";

      if (categories[cat]) {
        categories[cat].count += 1;
        categories[cat].bytes += Number(f.size_bytes || 0);
      } else {
        categories.document.count += 1;
        categories.document.bytes += Number(f.size_bytes || 0);
      }
    }

    return NextResponse.json({
      limitBytes,
      usedBytes,
      remainingBytes,
      usagePercent,
      totalFiles: files.length,
      categories,
      recentFiles: files.slice(0, 10).map((f) => ({
        id: f.id,
        name: f.name,
        mime_type: f.mime_type,
        size_bytes: f.size_bytes,
        created_at: f.created_at,
      })),
    });
  } catch (err) {
    console.error("/api/storage/stats error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
