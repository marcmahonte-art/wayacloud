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

const presignSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const rateLimitKey = forwardedFor.split(",")[0]?.trim() ?? "local";

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

  const safeName = sanitizeFileName(body.data.fileName);
  const key = `uploads/${randomBytes(32).toString("hex")}-${safeName}`;
  const command = new PutObjectCommand({
    Bucket: getWasabiBucket(),
    Key: key,
    ContentType: body.data.mimeType,
  });
  const url = await getSignedUrl(getWasabiClient(), command, { expiresIn: 900 });

  return NextResponse.json({ url, key });
}
