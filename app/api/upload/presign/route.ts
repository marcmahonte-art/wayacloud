import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rateLimit";
import { generatePresignedPut, buildWhatsAppKey, buildUploadKey } from "@/lib/wasabi";
import { validateWhatsAppExtension, sanitizeFileName } from "@/lib/file-validation";
import { hashMd5 } from "@/lib/md5";
import { randomBytes } from "crypto";

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive().max(5_368_709_120),
  md5: z.string().regex(/^[a-f0-9]{32}$/).optional(),
  source: z.enum(["whatsapp", "manual"]).default("manual"),
});

export async function POST(request: Request) {
  const serverSupabase = createServerSupabaseClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const rateLimitKey = `upload-presign:${user.id}:${forwardedFor.split(",")[0]?.trim() ?? "local"}`;
  if (isRateLimited(rateLimitKey, 100, 3600000)) {
    return NextResponse.json(
      { message: "Limite de 100 uploads par heure atteinte. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const body = presignSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ message: "Informations du fichier invalides." }, { status: 400 });
  }

  if (body.data.source === "whatsapp") {
    const extCheck = validateWhatsAppExtension(body.data.fileName);
    if (!extCheck.valid) {
      return NextResponse.json({ message: extCheck.error }, { status: 400 });
    }
  }

  const safeName = sanitizeFileName(body.data.fileName);
  let s3Key: string;
  let url: string;

  if (body.data.source === "whatsapp") {
    const randomHex = randomBytes(16).toString("hex");
    s3Key = buildWhatsAppKey(user.id, `${randomHex}-${safeName}`);
    url = await generatePresignedPut(s3Key, body.data.mimeType);
  } else {
    const randomHex = randomBytes(16).toString("hex");
    s3Key = buildUploadKey(user.id, safeName, randomHex);
    url = await generatePresignedPut(s3Key, body.data.mimeType);
  }

  return NextResponse.json({
    url,
    key: s3Key,
    fileName: safeName,
  });
}
