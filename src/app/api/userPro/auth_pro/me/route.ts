import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveProAccountId } from "@/lib/auth/resolveUserId";

export async function GET(req: Request) {
  try {
    const accountId = await resolveProAccountId(req as any, { debug: false });
    if (!accountId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        professionalId: true,
        role: true,
        memberships: {
          select: {
            organization: { select: { slug: true } },
            role: true,
            status: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    const activeMembership = account.memberships.find(
      (m) => m.status === "ACTIVE"
    );

    return NextResponse.json(
      {
        authenticated: true,
        accountId: account.id,
        email: account.email,
        hasProfessional: Boolean(account.professionalId),
        hasOrganization: Boolean(activeMembership),
        defaultOrgSlug: activeMembership?.organization.slug ?? null,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /api/userPro/auth_pro/me error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
