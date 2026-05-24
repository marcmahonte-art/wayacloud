import { NextResponse } from "next/server";
import { verifyCinetPaySignature } from "@/lib/cinetpay";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-cinetpay-signature") ?? "";

  if (!verifyCinetPaySignature(payload, signature)) {
    return NextResponse.json(
      { message: "Signature de paiement invalide." },
      { status: 401 },
    );
  }

  return NextResponse.json({ message: "Paiement reçu." });
}
