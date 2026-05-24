import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const confirmSchema = z.object({
  key: z.string().min(1),
  size: z.number().int().positive(),
});

export async function POST(request: Request) {
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

  const fingerprint = createHash("sha256")
    .update(`${body.data.key}:${body.data.size}`)
    .digest("hex");

  return NextResponse.json({
    message: "Upload confirmé.",
    fingerprint,
  });
}
