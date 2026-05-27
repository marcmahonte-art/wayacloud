import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const { code, discountPercent, maxUses, validDays } = await request.json();

  if (!code || !discountPercent) {
    return NextResponse.json({ message: "Code et pourcentage requis." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString();

  const { error } = await supabase.from("promo_codes").insert({
    code: code.toLowerCase().trim(),
    discount_percent: discountPercent,
    max_uses: maxUses || 1,
    used_count: 0,
    valid_until: validUntil,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const { id, isActive } = await request.json();

  if (!id) {
    return NextResponse.json({ message: "ID requis." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  await supabase.from("promo_codes").update({ is_active: isActive }).eq("id", id);

  return NextResponse.json({ success: true });
}
