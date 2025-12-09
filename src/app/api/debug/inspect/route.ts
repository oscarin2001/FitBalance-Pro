import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const headers: Record<string, string | null> = {};
    req.headers.forEach && req.headers.forEach((v, k) => (headers[k] = v));

    const cookieHeader = req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};
    cookieHeader.split(/;\s*/).forEach((c) => {
      if (!c) return;
      const [k, ...rest] = c.split("=");
      cookies[k] = decodeURIComponent(rest.join("=") || "");
    });

    return NextResponse.json({ ok: true, headers, cookies });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
