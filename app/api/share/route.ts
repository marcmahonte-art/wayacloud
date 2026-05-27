import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rateLimit";

const shareSchema = z.object({
  fileId: z.string().uuid(),
  maxDownloads: z.number().int().positive().max(100).default(10),
});

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const rateLimitKey = `${user.id}:${forwardedFor.split(",")[0]?.trim() ?? "local"}`;

  if (isRateLimited(`share:${rateLimitKey}`, 20, 3600000)) {
    return NextResponse.json(
      { message: "Trop de liens créés. Limite: 20/heure." },
      { status: 429 },
    );
  }

  const body = shareSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  const { data: file } = await supabase
    .from("files")
    .select("id, owner_id")
    .eq("id", body.data.fileId)
    .single();

  if (!file) {
    return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });
  }

  if (file.owner_id !== user.id) {
    return NextResponse.json({ message: "Vous n'êtes pas propriétaire de ce fichier." }, { status: 403 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, is_active, is_trial")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const { data: plan } = await supabase
    .from("storage_plans")
    .select("name, monthly_price_fcfa")
    .eq("id", sub?.plan_id ?? "")
    .single();

  const isOnFreeTier = !sub || sub.is_trial || !plan || plan.monthly_price_fcfa === 0 || plan.name === "Gratuit" || plan.name === "Essentiel";

  if (isOnFreeTier) {
    const { count } = await supabase
      .from("share_links")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString());

    if (count && count >= 5) {
      return NextResponse.json(
        { message: "Limite de 5 liens actifs. Passez à un plan supérieur." },
        { status: 403 },
      );
    }
  }

  const { data: fileData } = await supabase
    .from("files")
    .select("id, name, mime_type, size_bytes")
    .eq("id", body.data.fileId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const token = randomBytes(32).toString("hex");
  const tokenHash = token;

  const { error: insertError } = await supabase.from("share_links").insert({
    file_id: body.data.fileId,
    owner_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    max_downloads: body.data.maxDownloads,
    download_count: 0,
  });

  if (insertError) {
    console.error("Insert share link error:", insertError);
    return NextResponse.json({ message: "Erreur de création du lien." }, { status: 500 });
  }

  await supabase.rpc("insert_activity", {
    p_user_id: user.id,
    p_type: "share",
    p_title: `${fileData?.name || "Fichier"} partagé`,
    p_description: `Lien de partage créé (${body.data.maxDownloads} téléchargements max)`,
    p_metadata: JSON.stringify({
      file_id: body.data.fileId,
      file_name: fileData?.name,
      max_downloads: body.data.maxDownloads,
    }),
  });

  return NextResponse.json({
    shareUrl: `${request.headers.get("origin") || "https://wayacloud.bf"}/s/${token}`,
    token,
    file: fileData ? { name: fileData.name, mimeType: fileData.mime_type, sizeBytes: fileData.size_bytes } : null,
    owner: profile ? { name: profile.full_name } : null,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    maxDownloads: body.data.maxDownloads,
  });
}
