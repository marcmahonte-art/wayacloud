import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rateLimit";
import { headObject, generatePresignedGet } from "@/lib/wasabi";
import { logActivity } from "@/lib/activity";

const confirmSchema = z.object({
  key: z.string().min(1),
  size: z.number().int().positive(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  checksumSha256: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const rateLimitKey = `upload-confirm:${user.id}:${forwardedFor.split(",")[0]?.trim() ?? "local"}`;
  if (isRateLimited(rateLimitKey, 100, 3600000)) {
    return NextResponse.json(
      { message: "Limite de 100 confirmations par heure atteinte." },
      { status: 429 },
    );
  }

  const body = confirmSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ message: "Informations de confirmation invalides." }, { status: 400 });
  }

  try {
    const meta = await headObject(body.data.key);
    if (!meta) {
      return NextResponse.json(
        { message: "Fichier introuvable sur le stockage. L'upload a peut-être échoué." },
        { status: 404 },
      );
    }

    const admin = createAdminSupabaseClient();
    const { data: existing } = await admin
      .from("files")
      .select("id")
      .eq("object_key", body.data.key)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        message: "Fichier déjà enregistré.",
        fileId: existing.id,
      });
    }

    const { data: newFile, error: insertError } = await admin
      .from("files")
      .insert({
        owner_id: user.id,
        name: body.data.name,
        size_bytes: body.data.size,
        mime_type: body.data.mimeType,
        object_key: body.data.key,
        checksum_sha256: body.data.checksumSha256 ?? null,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { message: `Erreur d'enregistrement: ${insertError.message}` },
        { status: 500 },
      );
    }

    const { data: quota } = await admin
      .from("storage_quotas")
      .select("storage_used_bytes")
      .eq("user_id", user.id)
      .maybeSingle();
    if (quota) {
      await admin
        .from("storage_quotas")
        .update({ storage_used_bytes: quota.storage_used_bytes + body.data.size })
        .eq("user_id", user.id);
    }

    logActivity({
      userId: user.id,
      type: "upload",
      title: `Fichier importé : ${body.data.name}`,
      description: `${(body.data.size / (1024 * 1024)).toFixed(1)} Mo`,
      metadata: { file_id: newFile.id, file_name: body.data.name, size: body.data.size },
    });

    let publicUrl = "";
    try {
      publicUrl = await generatePresignedGet(body.data.key);
    } catch {
      publicUrl = "";
    }

    return NextResponse.json({
      message: "Upload confirmé avec succès.",
      fileId: newFile.id,
      url: publicUrl,
      storageUsed: (quota?.storage_used_bytes ?? 0) + body.data.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de la confirmation.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
