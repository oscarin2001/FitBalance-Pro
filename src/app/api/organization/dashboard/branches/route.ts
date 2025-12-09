import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) {
      console.warn(
        "requireOrgAccess failed for branches route; returning guard",
        {
          orgSlug,
        }
      );
      return guard;
    }
    const { org } = guard;

    const branches = await prisma.branch.findMany({
      where: { organizationId: org.id },
      orderBy: { name: "asc" },
    });

    // Compute per-branch metrics using new relations: ClientSubscription.branchId, Professional.branchId, Payment.branchId
    const enriched = await Promise.all(
      branches.map(async (b) => {
        const clientsCount = await prisma.clientSubscription.count({
          where: { branchId: b.id },
        });
        const professionalsCount = await prisma.professional.count({
          where: { branchId: b.id },
        });

        const revenueAgg = await prisma.payment.aggregate({
          _sum: { amountCents: true },
          where: {
            branchId: b.id,
            // ensure payment belongs to this org via subscription -> plan -> organizationId
            subscription: { plan: { organizationId: org.id } },
          },
        });

        const revenue = revenueAgg._sum.amountCents ?? 0;

        // manager info
        let managerProfessionalId: number | null = null;
        let managerName: string | null = null;
        if (b.managerProfessionalId) {
          managerProfessionalId = b.managerProfessionalId;
          try {
            const mgr = await prisma.professional.findUnique({
              where: { id: b.managerProfessionalId },
            });
            if (mgr)
              managerName = `${mgr.firstName}${
                mgr.lastName ? ` ${mgr.lastName}` : ""
              }`;
          } catch (e) {
            // ignore
          }
        }

        return {
          id: b.id,
          name: b.name,
          city: b.city,
          address: b.address,
          clientsCount,
          professionalsCount,
          revenue,
          managerProfessionalId,
          managerName,
        };
      })
    );

    // Attach createdBy/updatedBy from AuditLog if present
    try {
      const branchIds = branches.map((b) => b.id);
      const logs = await prisma.auditLog.findMany({
        where: {
          entity: "Branch",
          entityId: { in: branchIds },
          action: { in: ["create", "update"] },
        },
        orderBy: { timestamp: "asc" },
      });

      const logsByEntity = new Map<number, any[]>();
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

      // merge into enriched
      for (let i = 0; i < enriched.length; i++) {
        const e = enriched[i];
        const bLogs = logsByEntity.get(e.id) || [];
        const createLog = bLogs.find((x) => x.action === "create") || bLogs[0];
        const updateLogs = bLogs.filter((x) => x.action === "update");
        const lastUpdate = updateLogs.length
          ? updateLogs[updateLogs.length - 1]
          : bLogs[bLogs.length - 1];

        let createdBy = null;
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

        let updatedBy = null;
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

        enriched[i] = { ...e, createdBy, updatedBy };
      }
    } catch (err) {
      // best-effort: don't fail the entire response if audit lookup fails
      console.warn("Failed to enrich branches with audit actors", err);
    }

    const totalBranches = branches.length;
    const totalClients = enriched.reduce(
      (s, x) => s + (x.clientsCount || 0),
      0
    );
    const totalProfessionals = enriched.reduce(
      (s, x) => s + (x.professionalsCount || 0),
      0
    );
    const totalRevenue = enriched.reduce((s, x) => s + (x.revenue || 0), 0);

    return NextResponse.json({
      totalBranches,
      totalClients,
      totalProfessionals,
      totalRevenue,
      branches: enriched,
    });
  } catch (e) {
    console.error("GET /api/organization/dashboard/branches error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
