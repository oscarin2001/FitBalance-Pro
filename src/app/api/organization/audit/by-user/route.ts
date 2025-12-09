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

    const byUser = await prisma.auditLog.groupBy({
      by: ["performedById"],
      where: { performedById: { in: accountIds } },
      _count: { performedById: true },
      orderBy: { _count: { performedById: "desc" } },
      take: limit,
    });

    // fetch account info for top users
    const ids = byUser.map((b) => b.performedById);
    const accounts = await prisma.account.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });

    const result = byUser.map((b) => ({
      userId: b.performedById,
      count: b._count.performedById,
      account: accounts.find((a) => a.id === b.performedById),
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/organization/audit/by-user error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
