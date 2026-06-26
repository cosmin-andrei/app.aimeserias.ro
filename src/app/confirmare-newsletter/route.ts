import { NextRequest, NextResponse } from "next/server";

/**
 * Linkul din email (ContulMeu) pentru confirmarea newsletter. Apelăm SSO și redirecționăm
 * la URL-ul returnat de SSO (ex: /setari?newsletterConfirmed=true).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const emailId = request.nextUrl.searchParams.get("emailId");
  const authServerUrl = (
    process.env.AUTH_SERVER_URL ||
    process.env.NEXT_PUBLIC_AUTH_SERVER_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

  if (!token || !emailId) {
    return NextResponse.redirect(
      new URL("/setari?newsletterError=invalid", request.url),
      { status: 302 }
    );
  }

  const verifyHost =
    authServerUrl.includes("localhost") || authServerUrl.includes("127.0.0.1")
      ? authServerUrl.replace(/localhost/i, "127.0.0.1")
      : authServerUrl;

  const ssoUrl = `${verifyHost}/auth/email/newsletter/confirm?token=${encodeURIComponent(token)}&emailId=${encodeURIComponent(emailId)}`;
  const res = await fetch(ssoUrl, { redirect: "manual" });

  if (res.status === 302) {
    const location = res.headers.get("Location");
    if (location) {
      return NextResponse.redirect(location, { status: 302 });
    }
  }

  return NextResponse.redirect(
    new URL("/setari?newsletterError=1", request.url),
    { status: 302 }
  );
}
