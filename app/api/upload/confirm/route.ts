import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { insertFileRecord, updateStorageUsed, generatePublicUrl } from "@/lib/files";

const confirmSchema = z.object({
  key: z.string().min(1),
  size: z.number().int().positive(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Authentification requise." },
      { status: 401 },
    );
  }

  const body = confirmSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json(
      { message: "Informations d'upload invalides." },
      { status: 400 },
    );
  }

  if (!body.data.key.startsWith("uploads/")) {
    return NextResponse.json(
      { message: "Clé de stockage invalide." },
      { status: 400 },
    );
  }

  try {
    const fileId = await insertFileRecord({
      ownerId: user.id,
      objectKey: body.data.key,
      name: body.data.name,
      mimeType: body.data.mimeType,
      sizeBytes: body.data.size,
      checksumSha256: body.data.checksumSha256 ?? null,
    });

    await updateStorageUsed(user.id, body.data.size);

    const publicUrl = await generatePublicUrl(body.data.key);

    return NextResponse.json({
      message: "Upload confirmé.",
      fileId,
      url: publicUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de la confirmation.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
