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
    const { data: files } = await admin
      .from("files")
      .select("id, name, mime_type, size_bytes, created_at")
      .eq("owner_id", user.id)
      .neq("status", "deleted")
      .order("size_bytes", { ascending: false })
      .limit(20);

    return NextResponse.json({ files: files || [] });
  } catch (err) {
    console.error("/api/storage/largest error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
