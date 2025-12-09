import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug, ["OWNER", "ADMIN"]);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    // members accounts for this org
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      select: { accountId: true },
    });
    const accountIds = members.map((m) => m.accountId);

    const [totalLogs, byAction, recentCount] = await Promise.all([
      prisma.auditLog.count({ where: { performedById: { in: accountIds } } }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: { action: true },
        where: { performedById: { in: accountIds } },
      }),
      prisma.auditLog.count({
        where: {
          performedById: { in: accountIds },
          timestamp: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        },
      }),
    ]);

    const actionsSummary = byAction.map((b) => ({
      action: b.action,
      count: b._count.action,
    }));

    return NextResponse.json({
      totalLogs,
      actionsSummary,
      recent24h: recentCount,
    });
  } catch (e) {
    console.error("GET /api/organization/audit/kpis error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
