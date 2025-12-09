import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard as any;

    const professionals = await prisma.professional.findMany({
      where: {
        professionalOrganizations: { some: { organizationId: org.id } },
      },
      include: {
        professionalOrganizations: { where: { organizationId: org.id } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach createdBy/updatedBy information from AuditLog (if available)
    const proIds = professionals.map((p) => p.id);
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: { in: ["Professional", "ProfessionalOrganization"] },
        entityId: { in: proIds },
        action: { in: ["create", "update"] },
      },
      orderBy: { timestamp: "asc" },
    });

    const logsByEntity = new Map<number, Array<any>>();
    for (const l of logs) {
      const arr = logsByEntity.get(l.entityId) || [];
      arr.push(l);
      logsByEntity.set(l.entityId, arr);
    }

    const performerIds = Array.from(
      new Set(logs.map((l) => l.performedById).filter(Boolean))
    );
    const accounts = performerIds.length
      ? await prisma.account.findMany({
          where: { id: { in: performerIds } },
          include: { user: true },
        })
      : [];
    const accountById = new Map(accounts.map((a) => [a.id, a]));

    const rows = professionals.map((p) => {
      const pLogs = logsByEntity.get(p.id) || [];

      // createdBy: earliest 'create' log or first available
      let createdBy: any = null;
      const createLog = pLogs.find((x) => x.action === "create") || pLogs[0];
      if (createLog && createLog.performedById) {
        const acct = accountById.get(createLog.performedById as number);
        createdBy = acct
          ? {
              name: acct.user
                ? `${acct.user.firstName} ${acct.user.lastName || ""}`.trim()
                : undefined,
              email: acct.email,
            }
          : null;
      }

      // updatedBy: latest 'update' log or last available
      let updatedBy: any = null;
      const updateLogs = pLogs.filter((x) => x.action === "update");
      const lastUpdate = updateLogs.length
        ? updateLogs[updateLogs.length - 1]
        : pLogs[pLogs.length - 1];
      if (lastUpdate && lastUpdate.performedById) {
        const acct = accountById.get(lastUpdate.performedById as number);
        updatedBy = acct
          ? {
              name: acct.user
                ? `${acct.user.firstName} ${acct.user.lastName || ""}`.trim()
                : undefined,
              email: acct.email,
            }
          : null;
      }

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        type: p.type,
        branchId: p.branchId ?? null,
        createdAt: p.createdAt,
        role: p.professionalOrganizations?.[0]?.role ?? null,
        createdBy,
        updatedBy,
      };
    });

    return NextResponse.json({ professionals: rows });
  } catch (e) {
    console.error(
      "GET /api/organization/management/v1/professionals/list error:",
      e
    );
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
