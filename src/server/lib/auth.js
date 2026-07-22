import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectMongoDB from "@/server/lib/mongodb";
import User from "@/server/models/User";

const COOKIE_NAME = "pnwc_token";

export function signAuthToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

export function cleanAuthUser(user) {
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status || "Active",
  };
}

function isActiveUser(user) {
  return !["Inactive", "Disabled", "Blocked"].includes(user?.status);
}

export async function getAuthUser() {
  await connectMongoDB();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password").lean();
    if (!user || !isActiveUser(user)) {
      return null;
    }
    return cleanAuthUser(user);
  } catch {
    return null;
  }
}

export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function requireRole(user, allowedRoles = []) {
  return Boolean(user && allowedRoles.includes(user.role));
}

export { isActiveUser };
