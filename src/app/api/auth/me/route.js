import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import { getAuthUser } from "@/server/lib/auth";

export async function GET() {
  await connectMongoDB();
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
