import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return NextResponse.json({ db: "error", message: error.message }, { status: 503 });
    }

    return NextResponse.json({ db: "ok", timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database connection failed";
    return NextResponse.json({ db: "error", message }, { status: 503 });
  }
}
