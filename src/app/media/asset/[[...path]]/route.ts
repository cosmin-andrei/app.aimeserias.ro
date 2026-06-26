import { NextRequest, NextResponse } from "next/server";

const ASSETS_BASE = process.env.NEXT_PUBLIC_ASSETS_URL ?? "https://assets.onedu.ro";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }
  const path = pathSegments.join("/");
  const url = `${ASSETS_BASE.replace(/\/$/, "")}/${path}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") ?? "image/png";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
