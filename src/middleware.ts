/**
 * Next.js Middleware – redirecționează utilizatorii neautentificați la login local.
 *
 * Variabile de mediu în .env.local:
 *   AUTH_COOKIE_NAME=meserias_jwt
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwtPayload, isTokenExpired } from "@/lib/auth";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "meserias_jwt";

const STATIC_FILE =
  /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const jwt = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (jwt) {
    const payload = decodeJwtPayload(jwt);
    if (payload && !isTokenExpired(payload)) {
      return NextResponse.next();
    }
  }

  if (STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const publicPaths = [
    "/auth",
    "/media",
    "/_next",
    "/favicon",
    "/images",
    "/invitatie",
    "/confirmare-email",
    "/confirmare-newsletter",
  ];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) {
    return NextResponse.next();
  }

  const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
  const signInUrl = new URL("/auth/sign-in", request.nextUrl.origin);
  signInUrl.searchParams.set("returnUrl", returnUrl);
  const response = NextResponse.redirect(signInUrl);
  if (jwt) {
    response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
