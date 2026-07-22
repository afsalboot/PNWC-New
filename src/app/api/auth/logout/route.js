import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/server/lib/auth";

export async function POST() {
  return clearAuthCookie(NextResponse.json({ ok: true }));
}
