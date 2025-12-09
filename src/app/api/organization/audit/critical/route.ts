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

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      select: { accountId: true },
    });
    const accountIds = members.map((m) => m.accountId);

    // define critical actions heuristics: deletes and updates
    const logs = await prisma.auditLog.findMany({
      where: {
        performedById: { in: accountIds },
        OR: [
          { action: { in: ["delete", "DELETE", "Remove"] } },
          { action: { contains: "update" } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (e) {
    console.error("GET /api/organization/audit/critical error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
