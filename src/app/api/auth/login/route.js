import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import { cleanAuthUser, isActiveUser, setAuthCookie, signAuthToken } from "@/server/lib/auth";
import User from "@/server/models/User";

export async function POST(request) {
  await connectMongoDB();
  const payload = await request.json();
  const username = String(payload.username || payload.email || "").trim().toLowerCase();
  const user = await User.findOne({ username }).lean();

  if (!user || !isActiveUser(user)) {
    return NextResponse.json({ message: "Invalid login details" }, { status: 401 });
  }

  const isValidPassword = await bcrypt.compare(payload.password || "", user.password || "");
  if (!isValidPassword) {
    return NextResponse.json({ message: "Invalid login details" }, { status: 401 });
  }

  const token = signAuthToken(user);
  const response = NextResponse.json({ user: cleanAuthUser(user) });
  return setAuthCookie(response, token);
}
