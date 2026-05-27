import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "L'avatar ne doit pas dépasser 2 Mo" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const key = `${user.id}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(key, file, { upsert: true });

  if (uploadErr) {
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(key);
  const avatarUrl = urlData.publicUrl;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateErr) {
    return NextResponse.json({ error: "Échec de la mise à jour du profil" }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  const prefix = user.id;
  const { data: files } = await supabase.storage.from("avatars").list();
  const toRemove = (files || []).filter(f => f.name.startsWith(prefix)).map(f => f.name);
  if (toRemove.length) {
    await supabase.storage.from("avatars").remove(toRemove);
  }

  return NextResponse.json({ success: true });
}
