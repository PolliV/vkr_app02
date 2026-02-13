import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, debug: "GET works" });
}

export async function POST() {
  return NextResponse.json({ ok: true, debug: "POST works" });
}
