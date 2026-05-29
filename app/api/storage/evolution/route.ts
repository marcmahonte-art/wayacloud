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
      .select("size_bytes, created_at")
      .eq("owner_id", user.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: true });

    const daily: Record<string, number> = {};

    for (const f of files || []) {
      const day = new Date(f.created_at).toISOString().slice(0, 10);
      daily[day] = (daily[day] || 0) + Number(f.size_bytes || 0);
    }

    const evolution = Object.entries(daily)
      .map(([date, bytes]) => ({ date, bytes }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let cumulative = 0;
    const cumulativeEvolution = evolution.map((e) => {
      cumulative += e.bytes;
      return { date: e.date, bytes: cumulative };
    });

    return NextResponse.json({ evolution: cumulativeEvolution });
  } catch (err) {
    console.error("/api/storage/evolution error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
