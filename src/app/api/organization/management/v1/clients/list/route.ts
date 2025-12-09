import { NextResponse } from "next/server";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: Request,
  { params }: { params?: { orgSlug?: string } } = {}
) {
  const url = new URL(req.url);
  const orgSlug =
    params?.orgSlug || url.searchParams.get("orgSlug") || undefined;
  if (!orgSlug)
    return NextResponse.json({ error: "orgSlug missing" }, { status: 400 });

  const { org } = await requireOrgAccess(req as any, orgSlug);

  // find users who have at least one subscription to a plan owned by this org
  const users = await prisma.user.findMany({
    where: {
      subscriptions: { some: { plan: { organizationId: org.id } } },
    },
    include: {
      account: true,
      // load the most recent subscription for this org if exists
      subscriptions: {
        where: { plan: { organizationId: org.id } },
        include: { plan: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      // any coach assignments (we'll pick the latest)
      assignments: {
        where: { type: "COACH" },
        include: {
          professional: {
            include: { account: { include: { user: true } }, branch: true },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const userIds = users.map((u) => u.id);

  // fetch audit logs (created/updated) for these users
  const logs = await prisma.auditLog.findMany({
    where: { entity: "User", entityId: { in: userIds } },
    orderBy: { timestamp: "desc" },
  });

  // map performer accounts -> users
  const performerIds = Array.from(
    new Set(logs.map((l) => l.performedById).filter(Boolean))
  );
  const performerAccounts = await prisma.account.findMany({
    where: { userId: { in: performerIds } },
    include: { user: true },
  });
  const accountByUserId = new Map(performerAccounts.map((a) => [a.userId, a]));

  // fetch branch names used by coaches or subscriptions
  const branchIds = new Set<string>();
  users.forEach((u) => {
    const sub = u.subscriptions?.[0];
    if (sub && (sub as any).branchId) branchIds.add((sub as any).branchId);
    const coach = (u as any).assignments?.[0]?.professional;
    if (coach && (coach as any).branchId)
      branchIds.add((coach as any).branchId);
  });
  const branches = branchIds.size
    ? await prisma.branch.findMany({
        where: { id: { in: Array.from(branchIds) } },
      })
    : [];
  const branchById = new Map(branches.map((b) => [b.id, b]));

  const rows = users.map((u) => {
    const logCreated = logs.find(
      (l) => l.action === "CREATE" && l.entityId === u.id
    );
    const logUpdated = logs.find(
      (l) => l.action !== "CREATE" && l.entityId === u.id
    );

    const createdByAccount = logCreated
      ? accountByUserId.get(logCreated.performedById || "")
      : null;
    const updatedByAccount = logUpdated
      ? accountByUserId.get(logUpdated.performedById || "")
      : null;

    const coachAssign = (u as any).assignments?.[0];
    const coach = coachAssign?.professional;
    const coachUser = (coach as any)?.account?.user;

    const recentSub: any = u.subscriptions?.[0];
    const branch = recentSub?.branchId
      ? branchById.get(recentSub.branchId)
      : undefined;

    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.account?.email || null,
      coach: coachUser
        ? {
            id: coachUser.id,
            name: `${coachUser.firstName || ""} ${
              coachUser.lastName || ""
            }`.trim(),
            branchId: coach?.branchId ?? null,
          }
        : null,
      branch: branch ? { id: branch.id, name: branch.name } : null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      createdBy: createdByAccount
        ? {
            id: createdByAccount.user?.id,
            name: `${createdByAccount.user?.firstName || ""} ${
              createdByAccount.user?.lastName || ""
            }`.trim(),
            email: createdByAccount.email,
          }
        : null,
      updatedBy: updatedByAccount
        ? {
            id: updatedByAccount.user?.id,
            name: `${updatedByAccount.user?.firstName || ""} ${
              updatedByAccount.user?.lastName || ""
            }`.trim(),
            email: updatedByAccount.email,
          }
        : null,
    };
  });

  return NextResponse.json({ rows });
}
