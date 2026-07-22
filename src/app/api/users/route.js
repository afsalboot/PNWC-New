import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import { getAuthUser, requireRole } from "@/server/lib/auth";
import User from "@/server/models/User";

const USER_ROLES = ["super_admin", "manager", "volunteer"];

export async function GET() {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  if (!requireRole(authUser, ["super_admin"])) {
    return NextResponse.json({ message: "Super admin access required" }, { status: 403 });
  }
  const users = await User.find().sort({ createdAt: -1 }).select("-password").lean();
  return NextResponse.json(
    users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status || "Active",
    })),
  );
}

export async function PATCH(request) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  if (!requireRole(authUser, ["super_admin"])) {
    return NextResponse.json({ message: "Super admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const userId = String(payload.id || "");
  const role = String(payload.role || "");

  if (!userId) {
    return NextResponse.json({ message: "User is required" }, { status: 400 });
  }
  if (!USER_ROLES.includes(role)) {
    return NextResponse.json({ message: "Invalid user role" }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (user.role === "super_admin" && role !== "super_admin") {
    const superAdminCount = await User.countDocuments({ role: "super_admin" });
    if (superAdminCount <= 1) {
      return NextResponse.json({ message: "At least one super admin is required" }, { status: 400 });
    }
  }

  user.role = role;
  await user.save();

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status || "Active",
  });
}
