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

    const byIp = await prisma.auditLog.groupBy({
      by: ["ipAddress"],
      where: { performedById: { in: accountIds } },
      _count: { ipAddress: true },
      orderBy: { _count: { ipAddress: "desc" } },
      take: limit,
    });

    return NextResponse.json(
      byIp.map((b) => ({ ip: b.ipAddress, count: b._count.ipAddress }))
    );
  } catch (e) {
    console.error("GET /api/organization/audit/by-ip error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
