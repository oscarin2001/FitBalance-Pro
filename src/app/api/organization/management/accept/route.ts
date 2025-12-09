import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";
import { aceptarInvitacion } from "@/lib/organizacion";

function getTokenCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const name =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export async function POST(req: Request) {
  try {
    const tokenInvite = (await req.json().catch(() => ({})))?.token;
    if (!tokenInvite)
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );

    const token = getTokenCookie(req);
    if (!token)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const secret = process.env.AUTH_SECRET;
    if (!secret)
      return NextResponse.json(
        { error: "Missing auth configuration" },
        { status: 500 }
      );

    let payload: any = null;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = (payload?.email ?? "").toString().toLowerCase();
    if (!email)
      return NextResponse.json(
        { error: "Invalid session email" },
        { status: 401 }
      );

    const account = await prisma.account.findUnique({ where: { email } });
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const res = await aceptarInvitacion({
      token: tokenInvite,
      accountId: account.id,
    });

    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    console.error("POST /api/organization/management/accept error:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
