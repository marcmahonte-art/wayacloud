import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "WayaCloud",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
}
