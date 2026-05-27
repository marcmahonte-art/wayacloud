import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { code } = await request.json() as { code?: string };
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, message: "Code requis." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("promo_codes")
    .select("id, code, discount_percent, max_uses, used_count, valid_until, is_active")
    .eq("code", code.toLowerCase().trim())
    .single();

  if (!data) {
    return NextResponse.json({ valid: false, message: "Code promo invalide." });
  }

  if (!data.is_active) {
    return NextResponse.json({ valid: false, message: "Ce code promo n'est plus actif." });
  }

  if (data.valid_until && new Date(data.valid_until) < new Date()) {
    return NextResponse.json({ valid: false, message: "Ce code promo a expiré." });
  }

  if (data.max_uses > 0 && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, message: "Ce code promo a atteint sa limite d'utilisations." });
  }

  return NextResponse.json({
    valid: true,
    id: data.id,
    discountPercent: data.discount_percent,
  });
}
