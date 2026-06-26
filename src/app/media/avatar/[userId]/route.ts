import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "onedu_jwt";

/**
 * Proxy pentru avatar: toate imaginile de profil sunt servite prin ContulMeu
 * (contulmeu.onedu.ro / localhost), nu direct de la SSO. Citește JWT din cookie,
 * cere imaginea de la SSO cu Bearer și o returnează.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  const jwt = match ? decodeURIComponent(match[1].trim()) : null;
  if (!jwt) return new NextResponse(null, { status: 401 });

  const authServerUrl = (
    process.env.AUTH_SERVER_URL ||
    process.env.NEXT_PUBLIC_AUTH_SERVER_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

  const res = await fetch(`${authServerUrl}/auth/avatar/${userId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  if (!res.ok) return new NextResponse(null, { status: res.status });
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
