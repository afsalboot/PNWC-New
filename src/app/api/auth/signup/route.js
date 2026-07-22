import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import { cleanAuthUser, setAuthCookie, signAuthToken } from "@/server/lib/auth";
import User from "@/server/models/User";

export async function POST(request) {
  await connectMongoDB();
  const payload = await request.json();

  const username = String(payload.username || "").trim().toLowerCase();
  const password = String(payload.password || "");
  if (!payload.name || !username || !password) {
    return NextResponse.json({ message: "Name, username, and password are required" }, { status: 400 });
  }

  if (String(payload.name).trim().length < 2) {
    return NextResponse.json({ message: "Full name must be at least 2 characters" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username)) {
    return NextResponse.json({ message: "Username must be 3-24 lowercase characters using letters, numbers, dot, dash, or underscore" }, { status: 400 });
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) {
    return NextResponse.json({ message: "Password must be 8+ characters with uppercase, lowercase, and a number" }, { status: 400 });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return NextResponse.json({ message: "Username is already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: payload.name,
    username,
    email: payload.email || "",
    phone: payload.phone || "",
    role: "volunteer",
    password: passwordHash,
    status: "Active",
  });

  const token = signAuthToken(user);
  const response = NextResponse.json({ user: cleanAuthUser(user) }, { status: 201 });
  return setAuthCookie(response, token);
}
