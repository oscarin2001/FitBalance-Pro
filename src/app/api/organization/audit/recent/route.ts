import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const limit = Number(searchParams.get("limit") || "50");

    const guard = await requireOrgAccess(req, orgSlug, ["OWNER", "ADMIN"]);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      select: { accountId: true },
    });
    const accountIds = members.map((m) => m.accountId);

    const logs = await prisma.auditLog.findMany({
      where: { performedById: { in: accountIds } },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (e) {
    console.error("GET /api/organization/audit/recent error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
