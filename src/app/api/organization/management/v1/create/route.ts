import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { crearOrganizacion } from "@/lib/organizacion";
import prisma from "@/lib/db/prisma";

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

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim();
    const slug = body?.slug ? String(body.slug).trim() : undefined;
    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const email = (payload?.email ?? "").toString().toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const account = await prisma.account.findUnique({ where: { email } });
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const org = await crearOrganizacion({
      ownerAccountId: account.id,
      name,
      slug,
    });

    return NextResponse.json({ ok: true, organization: org });
  } catch (e: any) {
    console.error("POST /api/organization/management/v1/create error:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
