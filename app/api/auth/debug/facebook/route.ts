import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const { headers } = request;
  const host = headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? "https";
  const redirectTo = `${protocol}://${host}/auth/callback`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: data?.url ?? null });
}
