import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getWasabiBucket, getWasabiClient } from "@/lib/wasabi";
import { isRateLimited } from "@/lib/rateLimit";
import {
  sanitizeFileName,
  validateFileSize,
  validateFileType,
} from "@/lib/validators";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { findExistingFile, buildObjectKey } from "@/lib/files";

const presignSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
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

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const rateLimitKey = `${user.id}:${forwardedFor.split(",")[0]?.trim() ?? "local"}`;

  if (isRateLimited(`upload-presign:${rateLimitKey}`, 30, 60000)) {
    return NextResponse.json(
      { message: "Trop de demandes d'upload. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  const body = presignSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json(
      { message: "Informations du fichier invalides." },
      { status: 400 },
    );
  }

  if (!validateFileType(body.data.mimeType)) {
    return NextResponse.json(
      { message: "Type de fichier non autorisé." },
      { status: 400 },
    );
  }

  if (!validateFileSize(body.data.fileSize)) {
    return NextResponse.json(
      { message: "Le fichier dépasse la limite autorisée de 5 Go." },
      { status: 400 },
    );
  }

  if (body.data.checksumSha256) {
    const existing = await findExistingFile(user.id, body.data.checksumSha256);
    if (existing) {
      return NextResponse.json({
        exists: true,
        key: existing.object_key,
        fileId: existing.id,
        name: existing.name,
      });
    }
  }

  const safeName = sanitizeFileName(body.data.fileName);
  const randomHex = randomBytes(16).toString("hex");
  const key = buildObjectKey(user.id, safeName, randomHex);

  const command = new PutObjectCommand({
    Bucket: getWasabiBucket(),
    Key: key,
    ContentType: body.data.mimeType,
  });
  const url = await getSignedUrl(getWasabiClient(), command, { expiresIn: 900 });

  return NextResponse.json({ exists: false, url, key });
}
