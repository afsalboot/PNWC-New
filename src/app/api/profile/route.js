import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import { cleanAuthUser, getAuthUser } from "@/server/lib/auth";
import User from "@/server/models/User";

export async function PATCH(request) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  const payload = await request.json();
  const user = await User.findById(authUser.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  user.name = payload.name || user.name;
  user.email = payload.email || "";
  user.phone = payload.phone || "";
  user.profileImage = payload.profileImage || "";
  await user.save();

  return NextResponse.json({ user: cleanAuthUser(user) });
}
