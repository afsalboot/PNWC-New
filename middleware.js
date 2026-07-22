import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/borrowers",
  "/equipment",
  "/transactions",
  "/returns",
  "/settings",
  "/users",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const hasToken = Boolean(request.cookies.get("pnwc_token")?.value);

  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/signup") && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|Logo.jpeg).*)"],
};
