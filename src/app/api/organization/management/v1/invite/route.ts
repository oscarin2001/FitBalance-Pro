import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";
import { invitarMiembro } from "@/lib/organizacion";

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
    const organizationId = body?.organizationId
      ? Number(body.organizationId)
      : null;
    const orgSlug = body?.orgSlug ? String(body.orgSlug) : null;
    const email = body?.email ? String(body.email).toLowerCase() : null;
    const role = body?.role ? String(body.role).toUpperCase() : "MEMBER";

    if (!email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!organizationId && !orgSlug)
      return NextResponse.json(
        { error: "organizationId or orgSlug is required" },
        { status: 400 }
      );

    let orgId = organizationId;
    if (!orgId && orgSlug) {
      const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });
      if (!org)
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      orgId = org.id;
    }

    const account = await prisma.account.findUnique({
      where: { email: (payload?.email ?? "").toString().toLowerCase() },
    });
    if (!account)
      return NextResponse.json(
        { error: "Requester account not found" },
        { status: 401 }
      );

    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_accountId: {
          organizationId: orgId!,
          accountId: account.id,
        },
      },
    });
    if (!member || !["OWNER", "ADMIN"].includes(member.role))
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );

    const result = await invitarMiembro({
      organizationId: orgId!,
      email,
      role,
      invitedByAccountId: account.id,
    });

    return NextResponse.json({ ok: true, token: result.token });
  } catch (e: any) {
    console.error("POST /api/organization/management/v1/invite error:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
