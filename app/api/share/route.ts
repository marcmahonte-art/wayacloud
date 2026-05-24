import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export function POST() {
  const token = randomBytes(32).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    token,
    url: `${appUrl}/s/${token}`,
  });
}
