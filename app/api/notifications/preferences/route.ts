import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (!data) {
    const { data: newPrefs, error: insertError } = await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (insertError) return NextResponse.json({ message: insertError.message }, { status: 500 });
    return NextResponse.json(newPrefs);
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const body = await request.json();
  const allowedFields = [
    "email_upload", "email_backup", "email_share", "email_payment", "email_marketing",
    "push_upload", "push_backup", "push_share", "push_storage_warning", "sms_payment",
  ];

  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (typeof body[field] === "boolean") {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "Aucun champ valide fourni." }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("notification_preferences")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
