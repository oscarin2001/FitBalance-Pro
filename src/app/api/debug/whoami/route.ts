import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth/resolveUserId";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Resolve internal user id (this also logs debug info server-side)
    const userId = await resolveUserId(req as any, { debug: true });

    // Try to read the NextAuth token for additional info
    let token = null;
    try {
      token = await getToken({
        req: req as any,
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
      });
    } catch (e) {
      console.warn("whoami: getToken failed", e);
    }

    return NextResponse.json({ ok: true, userId: userId ?? null, token });
  } catch (e: any) {
    console.error("/api/debug/whoami error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
