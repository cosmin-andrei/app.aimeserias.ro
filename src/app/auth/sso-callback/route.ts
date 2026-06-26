import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "onedu_jwt";
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Primește SSO token prin POST (securizat, nu prin URL), îl schimbă cu JWT
 * pe server la SSO /verifytoken, setează cookie-ul și redirecționează.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let ssoToken: string | null = null;
    let returnUrl: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      ssoToken = (formData.get("ssoToken") as string)?.trim() || null;
      returnUrl = (formData.get("returnUrl") as string)?.trim() || null;
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      ssoToken = body?.ssoToken?.trim() || null;
      returnUrl = body?.returnUrl?.trim() || null;
    }

    const authServerUrl = (process.env.AUTH_SERVER_URL || "http://localhost:4000").replace(
      /\/$/,
      ""
    );
    const loginUrl = (serviceURL: string) =>
      `${authServerUrl}/login?serviceURL=${encodeURIComponent(serviceURL)}`;

    if (!ssoToken) {
      return NextResponse.redirect(loginUrl(new URL("/", request.url).toString()), {
        status: 302,
      });
    }

    const appToken =
      process.env.AUTH_APP_TOKEN || process.env.NEXT_PUBLIC_AUTH_APP_TOKEN;
    if (!appToken) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[sso-callback] AUTH_APP_TOKEN not set");
      }
      return NextResponse.redirect(loginUrl(new URL("/", request.url).toString()), {
        status: 302,
      });
    }

    const verifyHost =
      authServerUrl.includes("localhost") || authServerUrl.includes("127.0.0.1")
        ? authServerUrl.replace(/localhost/i, "127.0.0.1")
        : authServerUrl;

    const verifyRes = await fetch(
      `${verifyHost}/verifytoken?ssoToken=${encodeURIComponent(ssoToken)}`,
      { headers: { Authorization: `Bearer ${appToken}` } }
    );
    const data = (await verifyRes.json().catch(() => ({}))) as {
      token?: string;
      message?: string;
    };

    if (!verifyRes.ok || !data.token) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[sso-callback] verify failed", {
          status: verifyRes.status,
          body: data,
        });
      }
      const target = returnUrl || new URL("/", request.url).toString();
      return NextResponse.redirect(loginUrl(target), { status: 302 });
    }

    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    const isSecure = request.url.startsWith("https:");
    const cookieValue = `${AUTH_COOKIE_NAME}=${data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${isSecure ? "; Secure" : ""}`;

    const destination =
      !returnUrl
        ? new URL("/", request.url)
        : returnUrl.startsWith("http://") || returnUrl.startsWith("https://")
          ? new URL(returnUrl)
          : new URL(returnUrl, request.url);

    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: destination.toString(),
        "Set-Cookie": cookieValue,
      },
    });
  } catch {
    const authServerUrl = (process.env.AUTH_SERVER_URL || "http://localhost:4000").replace(
      /\/$/,
      ""
    );
    const serviceURL = new URL("/", request.url).toString();
    return NextResponse.redirect(
      `${authServerUrl}/login?serviceURL=${encodeURIComponent(serviceURL)}`,
      { status: 302 }
    );
  }
}
