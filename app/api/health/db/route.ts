import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "";
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
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
