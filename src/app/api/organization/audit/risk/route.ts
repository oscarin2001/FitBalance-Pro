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

    // Simple risk patterns:
    // - users with > 50 actions in last 24h
    // - IPs with > 200 actions in last 24h
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24);

    // Prisma groupBy signatures vary between versions and can be brittle.
    // To keep compatibility, fetch recent logs and aggregate in-memory.
    const recentLogs = await prisma.auditLog.findMany({
      where: { performedById: { in: accountIds }, timestamp: { gte: since } },
      select: { performedById: true, ipAddress: true },
    });

    const userCounts: Record<number, number> = {};
    const ipCounts: Record<string, number> = {};

    for (const l of recentLogs) {
      if (l.performedById) {
        userCounts[l.performedById] = (userCounts[l.performedById] || 0) + 1;
      }
      const ip = l.ipAddress ?? "unknown";
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }

    const heavyUsers = Object.entries(userCounts)
      .map(([id, count]) => ({ performedById: Number(id), count }))
      .filter((r) => r.count > 50)
      .sort((a, b) => b.count - a.count);

    const heavyIps = Object.entries(ipCounts)
      .map(([ip, count]) => ({
        ipAddress: ip === "unknown" ? null : ip,
        count,
      }))
      .filter((r) => r.count > 200)
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ heavyUsers, heavyIps });
  } catch (e) {
    console.error("GET /api/organization/audit/risk error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
