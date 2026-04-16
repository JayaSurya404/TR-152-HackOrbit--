import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "InfraSight AI backend",
    status: "ok",
    time: new Date().toISOString(),
  });
}