import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();

    // Essayer de lire la table storage_quotas
    const { data: quotaData, error: quotaError } = await admin
      .from("storage_quotas")
      .select("storage_used_bytes, storage_limit_bytes")
      .eq("user_id", user.id)
      .maybeSingle();

    // Si la table storage_quotas n'a pas de ligne ou erreur, calculer à partir des fichiers
    let usedBytes: number;
    let limitBytes: number;

    if (quotaError || !quotaData) {
      // Fallback : calculer la taille depuis les fichiers
      const { data: files } = await admin
        .from("files")
        .select("size_bytes")
        .eq("owner_id", user.id)
        .neq("status", "deleted");

      usedBytes = (files || []).reduce((sum, f) => sum + Number(f.size_bytes || 0), 0);
      limitBytes = 5_368_709_120; // 5 Go par défaut
    } else {
      usedBytes = quotaData.storage_used_bytes ?? 0;
      limitBytes = quotaData.storage_limit_bytes ?? 5_368_709_120;
    }

    const percentage = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

    return NextResponse.json({ used: usedBytes, limit: limitBytes, percentage });
  } catch (err) {
    console.error("/api/storage_quotas error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
